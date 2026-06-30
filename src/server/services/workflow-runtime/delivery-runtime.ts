import { sendTelegramMessage } from "@/server/adapters/telegram/telegram-adapter";
import type {
  FlowDelivery,
  FlowOrderBumpOffer,
  FlowPlan,
  FlowPlanDefaultDelivery,
} from "@/server/services/flows";
import { EventLogger } from "@/server/services/workflow-runtime/event-logger";
import { MediaRenderer } from "@/server/services/workflow-runtime/media-renderer";
import type {
  RuntimeConfig,
  RuntimeSession,
  RuntimeSupabase,
} from "@/server/services/workflow-runtime/types";
import { VariableResolver } from "@/server/services/workflow-runtime/variable-resolver";

type DeliveryConfig = {
  linkUrl?: string;
  message?: string;
  telegramDestinationId?: string;
  type: string;
};

function planDelivery(plan: FlowPlan, fallback: FlowPlanDefaultDelivery | null) {
  if (!plan.useDefaultDelivery) {
    return {
      linkUrl: plan.deliveryConfig.linkUrl,
      message: plan.deliveryConfig.message,
      telegramDestinationId: plan.deliveryConfig.telegramDestinationId,
      type: plan.deliveryType,
    };
  }

  if (!fallback) return null;

  return {
    linkUrl: fallback.linkUrl,
    message: fallback.message,
    telegramDestinationId: fallback.telegramDestinationId,
    type: fallback.type,
  };
}

export class DeliveryRuntime {
  private readonly events: EventLogger;
  private readonly media = new MediaRenderer();

  constructor(private readonly supabase: RuntimeSupabase) {
    this.events = new EventLogger(supabase);
  }

  async executePaymentApproved(input: {
    config: RuntimeConfig;
    resolver: VariableResolver;
    session: RuntimeSession;
  }) {
    const template = input.config.graph.messages?.payment_approved;

    if (template?.media?.length) {
      await this.media.sendMessageMedia({
        chatId: Number(input.session.telegram_chat_external_id),
        media: template.media,
        token: input.config.bot.token,
      });
    }

    await sendTelegramMessage({
      chatId: Number(input.session.telegram_chat_external_id),
      text: input.resolver.render(template?.text || "Pagamento aprovado."),
      token: input.config.bot.token,
    });
  }

  async executeMainDelivery(input: {
    config: RuntimeConfig;
    plan: FlowPlan;
    resolver: VariableResolver;
    session: RuntimeSession;
  }) {
    const delivery = planDelivery(input.plan, input.config.graph.planDefaultDelivery);

    if (delivery) {
      await this.sendDelivery(input.config, input.session, input.resolver, delivery);
    }

    await this.events.log(input.session, "delivery_completed", {
      planId: input.plan.id,
    });
  }

  async executeNamedDelivery(input: {
    config: RuntimeConfig;
    deliveryId?: string | null;
    resolver: VariableResolver;
    session: RuntimeSession;
  }) {
    if (!input.deliveryId) return;

    const delivery = input.config.graph.deliveries.find(
      (item) => item.id === input.deliveryId,
    );

    if (!delivery) return;

    await this.sendDelivery(input.config, input.session, input.resolver, delivery);
    await this.events.log(input.session, "delivery_completed", {
      deliveryId: delivery.id,
    });
  }

  async executeOrderBumpDelivery(input: {
    config: RuntimeConfig;
    offer: FlowOrderBumpOffer | null | undefined;
    resolver: VariableResolver;
    session: RuntimeSession;
  }) {
    const offer = input.offer;

    if (!offer) return;

    if (offer.deliveryType && offer.deliveryType !== "default") {
      await this.sendDelivery(input.config, input.session, input.resolver, {
        linkUrl: offer.deliveryConfig?.linkUrl,
        message: offer.deliveryConfig?.message,
        telegramDestinationId: offer.deliveryConfig?.telegramDestinationId,
        type: offer.deliveryType,
      });
      await this.events.log(input.session, "delivery_completed", {
        kind: "order_bump",
      });
      return;
    }

    if (input.config.graph.planDefaultDelivery) {
      await this.sendDelivery(
        input.config,
        input.session,
        input.resolver,
        input.config.graph.planDefaultDelivery,
      );
      await this.events.log(input.session, "delivery_completed", {
        kind: "order_bump_default",
      });
      return;
    }

    await this.executeNamedDelivery({
      config: input.config,
      deliveryId: offer.deliveryId,
      resolver: input.resolver,
      session: input.session,
    });
  }

  async executeSequenceDelivery(input: {
    config: RuntimeConfig;
    deliveryConfig: DeliveryConfig;
    resolver: VariableResolver;
    session: RuntimeSession;
    sequenceId: string;
  }) {
    await this.sendDelivery(
      input.config,
      input.session,
      input.resolver,
      input.deliveryConfig,
    );
    await this.events.log(input.session, "delivery_completed", {
      sequenceId: input.sequenceId,
    });
  }

  private async sendDelivery(
    config: RuntimeConfig,
    session: RuntimeSession,
    resolver: VariableResolver,
    delivery: DeliveryConfig | FlowDelivery,
  ) {
    const chatId = Number(session.telegram_chat_external_id);

    if (delivery.type === "custom_message" && delivery.message) {
      await sendTelegramMessage({
        chatId,
        text: resolver.render(delivery.message),
        token: config.bot.token,
      });
      return;
    }

    if (delivery.type === "link" && delivery.linkUrl) {
      await sendTelegramMessage({
        chatId,
        replyMarkup: {
          inline_keyboard: [[
            {
              text: "Acessar",
              url: resolver.render(delivery.linkUrl),
            },
          ]],
        },
        text: "Seu acesso foi liberado.",
        token: config.bot.token,
      });
      return;
    }

    if ("file" in delivery && delivery.file?.signedUrl) {
      await sendTelegramMessage({
        chatId,
        text: resolver.render(delivery.file.signedUrl),
        token: config.bot.token,
      });
      return;
    }

    if (delivery.telegramDestinationId) {
      const { data } = await this.supabase
        .from("telegram_chats")
        .select("title,username")
        .eq("id", delivery.telegramDestinationId)
        .eq("workspace_id", config.workspaceId)
        .maybeSingle();

      const destination = data?.username ? `@${data.username}` : data?.title;

      if (destination) {
        await sendTelegramMessage({
          chatId,
          text: resolver.render(destination),
          token: config.bot.token,
        });
      }
    }
  }
}
