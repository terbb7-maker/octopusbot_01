import {
  answerTelegramCallbackQuery,
  sendTelegramMessage,
} from "@/server/adapters/telegram/telegram-adapter";
import type { TelegramInlineKeyboardMarkup } from "@/server/adapters/telegram/types";
import { createPaymentProvider } from "@/server/adapters/payments/payment-provider-factory";
import { CheckoutRuntime } from "@/server/services/workflow-runtime/checkout-runtime";
import { MediaRenderer } from "@/server/services/workflow-runtime/media-renderer";
import type {
  RuntimeCheckout,
  RuntimeConfig,
  RuntimeSession,
  RuntimeSupabase,
} from "@/server/services/workflow-runtime/types";
import { VariableResolver } from "@/server/services/workflow-runtime/variable-resolver";

function paymentKeyboard(checkoutId: string): TelegramInlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { callback_data: `pix:copy:${checkoutId}`, text: "Copiar PIX" },
        { callback_data: `payment:check:${checkoutId}`, text: "Verificar Pagamento" },
      ],
    ],
  };
}

function sandboxBadge(environment: string) {
  return environment === "sandbox" ? "<b>Modo Teste</b>\n" : "";
}

export class PaymentRuntime {
  private readonly checkoutRuntime: CheckoutRuntime;
  private readonly media = new MediaRenderer();

  constructor(private readonly supabase: RuntimeSupabase) {
    this.checkoutRuntime = new CheckoutRuntime(supabase);
  }

  async createPixAndSend(input: {
    checkout: RuntimeCheckout;
    config: RuntimeConfig;
    resolver: VariableResolver;
    session: RuntimeSession;
  }) {
    const provider = await createPaymentProvider(
      this.supabase,
      input.config.workspaceId,
    );
    const pix = await provider.createPix({
      checkoutId: input.checkout.id,
      currency: "BRL",
      flowId: input.config.flowId,
      planId: input.checkout.plan_id,
      sessionId: input.session.id,
      totalCents: input.checkout.total_cents,
      workspaceId: input.config.workspaceId,
    });
    const checkout = await this.checkoutRuntime.markPaymentCreated(
      input.checkout,
      pix.paymentId,
    );

    await this.supabase
      .from("flow_sessions")
      .update({
        conversation_status: "waiting_payment",
        current_step: "pix",
        payment_id: pix.paymentId,
        payment_status: pix.status,
      })
      .eq("id", input.session.id)
      .eq("workspace_id", input.session.workspace_id);

    const template = input.config.graph.messages?.pix_generated;
    if (template?.media?.length) {
      await this.media.sendMessageMedia({
        chatId: Number(input.session.telegram_chat_external_id),
        media: template.media,
        token: input.config.bot.token,
      });
    }

    const baseText = input.resolver.render(template?.text || "PIX gerado.");
    const text = [
      sandboxBadge(checkout.environment),
      baseText,
      "",
      pix.transactionId ? `<b>Transaction ID</b>\n<code>${pix.transactionId}</code>\n` : "",
      `<b>Expiracao</b>\n${new Date(pix.expiresAt).toLocaleString("pt-BR")}`,
      "",
      `<b>PIX Copia e Cola</b>`,
      `<code>${pix.copyPaste}</code>`,
      "",
      `<b>QR Code</b>`,
      `<code>${pix.qrCode}</code>`,
    ].join("\n");

    await sendTelegramMessage({
      chatId: Number(input.session.telegram_chat_external_id),
      replyMarkup: paymentKeyboard(checkout.id),
      text,
      token: input.config.bot.token,
    });

    return {
      checkout,
      status: pix.status,
    };
  }

  async sendCopyPaste(input: {
    callbackQueryId?: string;
    checkout: RuntimeCheckout;
    config: RuntimeConfig;
    session: RuntimeSession;
  }) {
    const { data: pix } = await this.supabase
      .from("pix_charges")
      .select("copy_paste")
      .eq("payment_id", input.checkout.payment_id ?? "")
      .maybeSingle();

    if (input.callbackQueryId) {
      await answerTelegramCallbackQuery({
        callbackQueryId: input.callbackQueryId,
        text: "Codigo PIX enviado.",
        token: input.config.bot.token,
      });
    }

    if (!pix?.copy_paste) return;

    await sendTelegramMessage({
      chatId: Number(input.session.telegram_chat_external_id),
      text: `<code>${pix.copy_paste}</code>`,
      token: input.config.bot.token,
    });
  }

  async getCheckoutStatus(checkout: RuntimeCheckout) {
    if (!checkout.payment_id) return "failed";
    const provider = await createPaymentProvider(
      this.supabase,
      checkout.workspace_id,
    );
    return provider.getStatus(checkout.payment_id);
  }
}
