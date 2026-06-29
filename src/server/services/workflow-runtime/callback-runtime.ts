import {
  answerTelegramCallbackQuery,
  sendTelegramMessage,
} from "@/server/adapters/telegram/telegram-adapter";
import { CheckoutRuntime } from "@/server/services/workflow-runtime/checkout-runtime";
import { ConversationRuntime } from "@/server/services/workflow-runtime/conversation-runtime";
import { DownsellExecutor } from "@/server/services/workflow-runtime/downsell-executor";
import { EventLogger } from "@/server/services/workflow-runtime/event-logger";
import { FlowRuntime } from "@/server/services/workflow-runtime/flow-runtime";
import { OfferCheckoutRuntime } from "@/server/services/workflow-runtime/offer-checkout-runtime";
import { OrderBumpExecutor } from "@/server/services/workflow-runtime/order-bump-executor";
import { PaymentCompletionRuntime } from "@/server/services/workflow-runtime/payment-completion-runtime";
import { PaymentRuntime } from "@/server/services/workflow-runtime/payment-runtime";
import { PlanExecutor } from "@/server/services/workflow-runtime/plan-executor";
import type {
  RuntimeCheckout,
  RuntimeConfig,
  RuntimeSession,
  RuntimeSupabase,
  RuntimeUpdate,
} from "@/server/services/workflow-runtime/types";
import { VariableResolver } from "@/server/services/workflow-runtime/variable-resolver";

export class CallbackRuntime {
  private readonly checkout: CheckoutRuntime;
  private readonly conversation: ConversationRuntime;
  private readonly downsell: DownsellExecutor;
  private readonly events: EventLogger;
  private readonly flowRuntime = new FlowRuntime();
  private readonly offerCheckout: OfferCheckoutRuntime;
  private readonly orderBump = new OrderBumpExecutor();
  private readonly payment: PaymentRuntime;
  private readonly paymentCompletion: PaymentCompletionRuntime;
  private readonly plans = new PlanExecutor();

  constructor(supabase: RuntimeSupabase) {
    this.checkout = new CheckoutRuntime(supabase);
    this.conversation = new ConversationRuntime(supabase);
    this.downsell = new DownsellExecutor(supabase);
    this.events = new EventLogger(supabase);
    this.offerCheckout = new OfferCheckoutRuntime(supabase);
    this.payment = new PaymentRuntime(supabase);
    this.paymentCompletion = new PaymentCompletionRuntime(supabase);
  }

  async handle(update: RuntimeUpdate) {
    const session = await this.conversation.loadActiveSession({
      botId: update.botId,
      chatExternalId: update.lead.chatExternalId,
      workspaceId: update.workspaceId,
    });
    if (!session) return { ignored: true, ok: true };

    const config = await this.flowRuntime.loadSessionConfig(session);
    if (!config) return { message: "Versao publicada nao encontrada.", ok: false };

    const lead = await this.conversation.loadLeadContext({
      botId: update.botId,
      chatExternalId: update.lead.chatExternalId,
      fallback: update.lead,
      workspaceId: update.workspaceId,
    });
    const resolver = new VariableResolver(config, lead);
    const data = update.callbackData ?? "";

    if (data.startsWith("cta:")) {
      return this.handleCta(config, session, resolver, update, data);
    }
    if (data.startsWith("plan:")) {
      return this.handlePlan(config, session, resolver, data);
    }
    if (data.startsWith("order_bump:")) {
      return this.handleOrderBump(config, session, resolver, data);
    }
    if (data.startsWith("pix:copy:")) {
      return this.handlePixCopy(config, session, update, data);
    }
    if (data.startsWith("payment:check:")) {
      return this.handlePaymentCheck(config, session, resolver, update, data);
    }
    if (data.startsWith("upsell:") || data.startsWith("downsell:")) {
      return this.offerCheckout.handle({ config, data, resolver, session });
    }

    return { ignored: true, ok: true };
  }

  private async answer(update: RuntimeUpdate, token: string, text?: string) {
    if (!update.callbackQueryId) return;

    await answerTelegramCallbackQuery({
      callbackQueryId: update.callbackQueryId,
      text,
      token,
    });
  }

  private async handleCta(
    config: RuntimeConfig,
    session: RuntimeSession,
    resolver: VariableResolver,
    update: RuntimeUpdate,
    data: string,
  ) {
    await this.events.log(session, "cta_clicked", { data });
    await this.answer(update, config.bot.token);

    const cta = config.graph.initialConfig.cta;
    if (data === "cta:send_message" && cta?.message) {
      await sendTelegramMessage({
        chatId: Number(session.telegram_chat_external_id),
        text: resolver.render(cta.message),
        token: config.bot.token,
      });
    }

    await this.conversation.updateSession(session, { current_step: "plans" });
    await this.plans.sendPlans(config, session);

    return { ok: true };
  }

  private async handlePlan(
    config: RuntimeConfig,
    session: RuntimeSession,
    resolver: VariableResolver,
    data: string,
  ) {
    const planId = data.replace("plan:", "");
    const plan = this.plans.findPlan(config, planId);
    if (!plan) return { message: "Plano nao encontrado.", ok: false };

    await this.events.log(session, "plan_selected", { planId });
    const checkout = await this.checkout.createDraft({
      config,
      planId,
      session,
      subtotalCents: plan.priceCents,
    });
    await this.events.log(session, "checkout_created", {
      checkoutId: checkout.id,
      totalCents: checkout.total_cents,
    });
    await this.conversation.updateSession(session, {
      current_step: "checkout",
      selected_plan_id: planId,
    });

    const offer = this.orderBump.findOffer(config, plan);
    if (offer?.enabled) {
      await this.events.log(session, "order_bump_shown", {
        checkoutId: checkout.id,
        planId,
      });
      await this.orderBump.sendOffer({ checkout, config, offer, resolver, session });
      return { ok: true };
    }

    await this.createPix(config, session, resolver, checkout);
    return { ok: true };
  }

  private async handleOrderBump(
    config: RuntimeConfig,
    session: RuntimeSession,
    resolver: VariableResolver,
    data: string,
  ) {
    const [, decision, checkoutId] = data.split(":");
    const checkout = await this.checkout.loadCheckout(checkoutId, config.workspaceId);
    if (!checkout) return { message: "Checkout nao encontrado.", ok: false };

    const plan = this.plans.findPlan(config, checkout.plan_id);
    const offer = plan ? this.orderBump.findOffer(config, plan) : null;
    let nextCheckout = checkout;

    if (decision === "accept" && offer?.enabled) {
      const orderBumpId =
        "id" in offer && typeof offer.id === "string" ? offer.id : "global";
      nextCheckout = await this.checkout.applyOrderBump({
        checkout,
        orderBumpCents: offer.priceCents,
        orderBumpId,
      });
      await this.events.log(session, "order_bump_accepted", {
        checkoutId,
        orderBumpCents: offer.priceCents,
      });
      await this.conversation.updateSession(session, {
        selected_order_bump_id: orderBumpId,
      });
    } else {
      await this.events.log(session, "order_bump_declined", { checkoutId });
    }

    await this.createPix(config, session, resolver, nextCheckout);
    return { ok: true };
  }

  private async handlePixCopy(
    config: RuntimeConfig,
    session: RuntimeSession,
    update: RuntimeUpdate,
    data: string,
  ) {
    const checkout = await this.checkout.loadCheckout(
      data.replace("pix:copy:", ""),
      config.workspaceId,
    );
    if (!checkout) return { ok: false };

    await this.payment.sendCopyPaste({
      callbackQueryId: update.callbackQueryId ?? undefined,
      checkout,
      config,
      session,
    });

    return { ok: true };
  }

  private async handlePaymentCheck(
    config: RuntimeConfig,
    session: RuntimeSession,
    resolver: VariableResolver,
    update: RuntimeUpdate,
    data: string,
  ) {
    const checkout = await this.checkout.loadCheckout(
      data.replace("payment:check:", ""),
      config.workspaceId,
    );
    if (!checkout) return { message: "Checkout nao encontrado.", ok: false };

    const status = await this.payment.getCheckoutStatus(checkout);
    if (status === "expired" || status === "cancelled") {
      await this.conversation.updateSession(session, {
        conversation_status: "expired",
        current_step: "downsell",
        payment_status: status,
      });

      const template = config.graph.messages?.pix_expired;
      if (template?.text) {
        await sendTelegramMessage({
          chatId: Number(session.telegram_chat_external_id),
          text: resolver.render(template.text),
          token: config.bot.token,
        });
      }

      await this.downsell.execute({ config, resolver, session });
      return { ok: true };
    }

    if (status !== "approved") {
      const pendingMessage = "Pagamento ainda nao localizado.";
      await this.answer(update, config.bot.token, pendingMessage);
      await sendTelegramMessage({
        chatId: Number(session.telegram_chat_external_id),
        text: pendingMessage,
        token: config.bot.token,
      });
      return { ok: true };
    }

    await this.paymentCompletion.finishPaidCheckout({
      checkout,
      config,
      resolver,
      session,
    });
    return { ok: true };
  }

  private async createPix(
    config: RuntimeConfig,
    session: RuntimeSession,
    resolver: VariableResolver,
    checkout: RuntimeCheckout,
  ) {
    const result = await this.payment.createPixAndSend({
      checkout,
      config,
      resolver,
      session,
    });
    await this.events.log(session, "pix_created", {
      checkoutId: result.checkout.id,
      paymentId: result.checkout.payment_id,
      totalCents: result.checkout.total_cents,
    });

    if (result.status === "approved") {
      await this.paymentCompletion.finishPaidCheckout({
        checkout: result.checkout,
        config,
        resolver,
        session,
      });
    }
  }

}
