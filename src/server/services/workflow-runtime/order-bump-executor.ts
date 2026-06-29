import { sendTelegramMessage } from "@/server/adapters/telegram/telegram-adapter";
import type { TelegramInlineKeyboardMarkup } from "@/server/adapters/telegram/types";
import type {
  FlowOrderBumpOffer,
  FlowPlan,
} from "@/server/services/flows";
import { MediaRenderer } from "@/server/services/workflow-runtime/media-renderer";
import type {
  RuntimeCheckout,
  RuntimeConfig,
  RuntimeSession,
} from "@/server/services/workflow-runtime/types";
import { VariableResolver } from "@/server/services/workflow-runtime/variable-resolver";

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(cents / 100);
}

function keyboard(checkoutId: string): TelegramInlineKeyboardMarkup {
  return {
    inline_keyboard: [
      [
        { callback_data: `order_bump:accept:${checkoutId}`, text: "Adicionar" },
        { callback_data: `order_bump:decline:${checkoutId}`, text: "Continuar sem" },
      ],
    ],
  };
}

export class OrderBumpExecutor {
  private readonly media = new MediaRenderer();

  findOffer(config: RuntimeConfig, plan: FlowPlan) {
    const orderBumps = config.graph.orderBumps;
    if (!orderBumps) return null;

    if (!plan.useGlobalOrderBump) {
      return orderBumps.individual.find((item) => item.planId === plan.id) ?? null;
    }

    return orderBumps.global?.enabled ? orderBumps.global : null;
  }

  async sendOffer(input: {
    checkout: RuntimeCheckout;
    config: RuntimeConfig;
    offer: FlowOrderBumpOffer;
    resolver: VariableResolver;
    session: RuntimeSession;
  }) {
    if (input.offer.image?.path) {
      await this.media.sendInitialMedia({
        chatId: Number(input.session.telegram_chat_external_id),
        media: {
          image: input.offer.image,
          type: "image",
        },
        token: input.config.bot.token,
      });
    }

    const text = [
      `<b>${input.resolver.render(input.offer.title)}</b>`,
      "",
      input.resolver.render(input.offer.message),
      "",
      `<b>${money(input.offer.priceCents)}</b>`,
    ].join("\n");

    await sendTelegramMessage({
      chatId: Number(input.session.telegram_chat_external_id),
      replyMarkup: keyboard(input.checkout.id),
      text,
      token: input.config.bot.token,
    });
  }
}
