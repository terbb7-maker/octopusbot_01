import { sendTelegramMessage } from "@/server/adapters/telegram/telegram-adapter";
import { CheckoutRuntime } from "@/server/services/workflow-runtime/checkout-runtime";
import { ConversationRuntime } from "@/server/services/workflow-runtime/conversation-runtime";
import { EventLogger } from "@/server/services/workflow-runtime/event-logger";
import { OrderBumpExecutor } from "@/server/services/workflow-runtime/order-bump-executor";
import { PaymentCompletionRuntime } from "@/server/services/workflow-runtime/payment-completion-runtime";
import { PaymentRuntime } from "@/server/services/workflow-runtime/payment-runtime";
import { PlanExecutor } from "@/server/services/workflow-runtime/plan-executor";
import { runtimeLog } from "@/server/services/workflow-runtime/runtime-logger";
import type {
  RuntimeCheckout,
  RuntimeConfig,
  RuntimeSession,
  RuntimeSupabase,
  RuntimeUpdate,
} from "@/server/services/workflow-runtime/types";
import { VariableResolver } from "@/server/services/workflow-runtime/variable-resolver";

export class PlanCallbackRuntime {
  private readonly checkout: CheckoutRuntime;
  private readonly conversation: ConversationRuntime;
  private readonly events: EventLogger;
  private readonly orderBump = new OrderBumpExecutor();
  private readonly payment: PaymentRuntime;
  private readonly paymentCompletion: PaymentCompletionRuntime;
  private readonly plans = new PlanExecutor();

  constructor(
    supabase: RuntimeSupabase,
    private readonly answer: (
      update: RuntimeUpdate,
      token: string,
      text?: string,
    ) => Promise<void>,
  ) {
    this.checkout = new CheckoutRuntime(supabase);
    this.conversation = new ConversationRuntime(supabase);
    this.events = new EventLogger(supabase);
    this.payment = new PaymentRuntime(supabase);
    this.paymentCompletion = new PaymentCompletionRuntime(supabase);
  }

  async handlePlanSelection(input: {
    config: RuntimeConfig;
    data: string;
    resolver: VariableResolver;
    session: RuntimeSession;
    update: RuntimeUpdate;
  }) {
    const { config, data, resolver, session, update } = input;
    await this.answer(update, config.bot.token, "Plano selecionado.");

    const planId = data.replace("plan:", "");
    const plan = this.plans.findPlan(config, planId);
    if (!plan) {
      runtimeLog("Erro encontrado: plano nao localizado", {
        flowId: config.flowId,
        planId,
        versionId: config.versionId,
      });
      await sendTelegramMessage({
        chatId: Number(session.telegram_chat_external_id),
        text: "Não foi possível localizar este plano. Tente novamente.",
        token: config.bot.token,
      });
      return { message: "Plano nao encontrado.", ok: false };
    }

    runtimeLog("Plano encontrado", {
      flowId: config.flowId,
      planId: plan.id,
      planName: plan.name,
      priceCents: plan.priceCents,
      versionId: config.versionId,
    });

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
    runtimeLog("Order bump encontrado", {
      enabled: Boolean(offer?.enabled),
      flowId: config.flowId,
      planId,
    });

    if (offer?.enabled) {
      await this.events.log(session, "order_bump_shown", {
        checkoutId: checkout.id,
        planId,
      });
      await this.orderBump.sendOffer({ checkout, config, offer, resolver, session });
      runtimeLog("Mensagem enviada", {
        checkoutId: checkout.id,
        type: "order_bump",
      });
      return { ok: true };
    }

    await this.createPix(config, session, resolver, checkout);
    return { ok: true };
  }

  async handleOrderBump(input: {
    config: RuntimeConfig;
    data: string;
    resolver: VariableResolver;
    session: RuntimeSession;
    update: RuntimeUpdate;
  }) {
    const { config, data, resolver, session, update } = input;
    await this.answer(update, config.bot.token);

    const [, decision, checkoutId] = data.split(":");
    const checkout = await this.checkout.loadCheckout(checkoutId, config.workspaceId);
    if (!checkout) {
      runtimeLog("Erro encontrado: checkout do order bump nao localizado", {
        checkoutId,
        decision,
        flowId: config.flowId,
      });
      await sendTelegramMessage({
        chatId: Number(session.telegram_chat_external_id),
        text: "Não foi possível localizar este pedido. Tente novamente.",
        token: config.bot.token,
      });
      return { message: "Checkout nao encontrado.", ok: false };
    }

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
