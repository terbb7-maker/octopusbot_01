import {
  answerTelegramCallbackQuery,
  sendTelegramMessage,
} from "@/server/adapters/telegram/telegram-adapter";
import { CallbackErrorResponder } from "@/server/services/workflow-runtime/callback-error-responder";
import { CheckoutRuntime } from "@/server/services/workflow-runtime/checkout-runtime";
import { ConversationRuntime } from "@/server/services/workflow-runtime/conversation-runtime";
import { DownsellExecutor } from "@/server/services/workflow-runtime/downsell-executor";
import { EventLogger } from "@/server/services/workflow-runtime/event-logger";
import { FlowRuntime } from "@/server/services/workflow-runtime/flow-runtime";
import { OfferCheckoutRuntime } from "@/server/services/workflow-runtime/offer-checkout-runtime";
import { PlanCallbackRuntime } from "@/server/services/workflow-runtime/plan-callback-runtime";
import { PaymentCompletionRuntime } from "@/server/services/workflow-runtime/payment-completion-runtime";
import { PaymentRuntime } from "@/server/services/workflow-runtime/payment-runtime";
import { PlanExecutor } from "@/server/services/workflow-runtime/plan-executor";
import {
  runtimeError,
  runtimeLog,
} from "@/server/services/workflow-runtime/runtime-logger";
import type {
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
  private readonly errorResponder: CallbackErrorResponder;
  private readonly events: EventLogger;
  private readonly flowRuntime = new FlowRuntime();
  private readonly offerCheckout: OfferCheckoutRuntime;
  private readonly planCallbacks: PlanCallbackRuntime;
  private readonly payment: PaymentRuntime;
  private readonly paymentCompletion: PaymentCompletionRuntime;
  private readonly plans = new PlanExecutor();

  constructor(supabase: RuntimeSupabase) {
    this.checkout = new CheckoutRuntime(supabase);
    this.conversation = new ConversationRuntime(supabase);
    this.downsell = new DownsellExecutor(supabase);
    this.errorResponder = new CallbackErrorResponder(this.answer.bind(this));
    this.events = new EventLogger(supabase);
    this.offerCheckout = new OfferCheckoutRuntime(supabase);
    this.planCallbacks = new PlanCallbackRuntime(
      supabase,
      this.answer.bind(this),
    );
    this.payment = new PaymentRuntime(supabase);
    this.paymentCompletion = new PaymentCompletionRuntime(supabase);
  }

  async handle(update: RuntimeUpdate) {
    const data = update.callbackData ?? "";

    runtimeLog("Callback recebido", {
      botId: update.botId,
      callbackData: data,
      chatExternalId: update.lead.chatExternalId,
      workspaceId: update.workspaceId,
    });

    try {
      const session = await this.conversation.loadActiveSession({
        botId: update.botId,
        chatExternalId: update.lead.chatExternalId,
        workspaceId: update.workspaceId,
      });

      if (!session) {
        await this.errorResponder.handleMissingSession(update);
        return { ignored: true, ok: true };
      }

      const config = await this.flowRuntime.loadSessionConfig(session);
      if (!config) {
        await this.errorResponder.handleMissingConfig(update);
        return { message: "Versao publicada nao encontrada.", ok: false };
      }

      runtimeLog("Fluxo encontrado", {
        deploymentId: config.deploymentId,
        flowId: config.flowId,
        sessionId: session.id,
        versionId: config.versionId,
      });

      const lead = await this.conversation.loadLeadContext({
        botId: update.botId,
        chatExternalId: update.lead.chatExternalId,
        fallback: update.lead,
        workspaceId: update.workspaceId,
      });
      const resolver = new VariableResolver(config, lead);

      if (data.startsWith("cta:")) {
        return this.handleCta(config, session, resolver, update, data);
      }
      if (data.startsWith("plan:")) {
        return this.planCallbacks.handlePlanSelection({
          config,
          data,
          resolver,
          session,
          update,
        });
      }
      if (data.startsWith("order_bump:")) {
        return this.planCallbacks.handleOrderBump({
          config,
          data,
          resolver,
          session,
          update,
        });
      }
      if (data.startsWith("pix:copy:")) {
        return this.handlePixCopy(config, session, update, data);
      }
      if (data.startsWith("payment:check:")) {
        return this.handlePaymentCheck(config, session, resolver, update, data);
      }
      if (data.startsWith("upsell:") || data.startsWith("downsell:")) {
        await this.answer(update, config.bot.token);
        return this.offerCheckout.handle({ config, data, resolver, session });
      }
      if (data.startsWith("upsell_decline:")) {
        await this.answer(update, config.bot.token, "Tudo bem, vamos continuar.");
        await sendTelegramMessage({
          chatId: Number(session.telegram_chat_external_id),
          text: "Tudo bem. Seguimos sem esta oferta.",
          token: config.bot.token,
        });
        return { ok: true };
      }

      await this.answer(update, config.bot.token, "Acao indisponivel.");
      return { ignored: true, ok: true };
    } catch (error) {
      runtimeError("Erro encontrado ao processar callback", error, {
        callbackData: data,
        chatExternalId: update.lead.chatExternalId,
      });
      await this.errorResponder.sendFriendlyError(update);
      return { ok: false };
    }
  }

  private async answer(update: RuntimeUpdate, token: string, text?: string) {
    if (!update.callbackQueryId) return;

    try {
      await answerTelegramCallbackQuery({
        callbackQueryId: update.callbackQueryId,
        text,
        token,
      });
    } catch (error) {
      runtimeError("Erro encontrado ao responder callback", error, {
        callbackQueryId: update.callbackQueryId,
      });
    }
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
    if (!checkout) {
      await this.answer(update, config.bot.token, "PIX nao encontrado.");
      await sendTelegramMessage({
        chatId: Number(session.telegram_chat_external_id),
        text: "Não foi possível localizar este PIX. Tente novamente.",
        token: config.bot.token,
      });
      return { ok: false };
    }

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
    if (!checkout) {
      await this.answer(update, config.bot.token, "Pagamento nao encontrado.");
      await sendTelegramMessage({
        chatId: Number(session.telegram_chat_external_id),
        text: "Não foi possível localizar este pagamento. Tente novamente.",
        token: config.bot.token,
      });
      return { message: "Checkout nao encontrado.", ok: false };
    }

    const status = await this.payment.getCheckoutStatus(checkout);
    runtimeLog("Status do pagamento consultado", {
      checkoutId: checkout.id,
      paymentId: checkout.payment_id,
      status,
    });
    if (status === "expired" || status === "cancelled") {
      await this.answer(update, config.bot.token, "Pagamento expirado.");
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

    await this.answer(update, config.bot.token, "Pagamento aprovado.");
    await this.paymentCompletion.finishPaidCheckout({
      checkout,
      config,
      resolver,
      session,
    });
    return { ok: true };
  }
}
