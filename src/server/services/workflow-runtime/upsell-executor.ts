import { sendTelegramMessage } from "@/server/adapters/telegram/telegram-adapter";
import type { TelegramInlineKeyboardMarkup } from "@/server/adapters/telegram/types";
import type { FlowUpsellSequence } from "@/server/services/flows";
import { EventLogger } from "@/server/services/workflow-runtime/event-logger";
import { MediaRenderer } from "@/server/services/workflow-runtime/media-renderer";
import type {
  RuntimeConfig,
  RuntimeSession,
  RuntimeSupabase,
} from "@/server/services/workflow-runtime/types";
import { VariableResolver } from "@/server/services/workflow-runtime/variable-resolver";

export class UpsellExecutor {
  private readonly events: EventLogger;
  private readonly media = new MediaRenderer();

  constructor(supabase: RuntimeSupabase) {
    this.events = new EventLogger(supabase);
  }

  private async wait(sequence: FlowUpsellSequence) {
    const value = sequence.delayValue ?? sequence.delayMinutes ?? 0;
    const unit = sequence.delayUnit ?? "minutes";
    const ms = unit === "seconds" ? value * 1000 : value * 60 * 1000;

    if (ms > 0) {
      await new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  private firstPlanId(sequence: FlowUpsellSequence) {
    return sequence.exclusivePlans?.[0]?.id ?? sequence.planId ?? "";
  }

  async execute(input: {
    config: RuntimeConfig;
    resolver: VariableResolver;
    session: RuntimeSession;
  }) {
    const sequences = input.config.graph.upsells.slice(0, 5);

    for (const sequence of sequences) {
      await this.wait(sequence);

      if (sequence.media) {
        await this.media.sendInitialMedia({
          chatId: Number(input.session.telegram_chat_external_id),
          media: sequence.media,
          token: input.config.bot.token,
        });
      } else if (sequence.image?.path) {
        await this.media.sendInitialMedia({
          chatId: Number(input.session.telegram_chat_external_id),
          media: { image: sequence.image, type: "image" },
          token: input.config.bot.token,
        });
      }

      const planId = this.firstPlanId(sequence);
      const buttons = planId
        ? [
          {
            callback_data: `upsell:${sequence.id}:${planId}`,
            text: sequence.button.label,
          },
        ]
        : [];

      if (!sequence.required) {
        buttons.push({
          callback_data: `upsell_decline:${sequence.id}`,
          text: sequence.declineButton?.label ?? "❌ Não quero",
        });
      }

      const replyMarkup: TelegramInlineKeyboardMarkup | undefined = buttons.length
        ? {
          inline_keyboard: [buttons],
        }
        : undefined;

      await sendTelegramMessage({
        chatId: Number(input.session.telegram_chat_external_id),
        replyMarkup,
        text: input.resolver.render(sequence.message),
        token: input.config.bot.token,
      });

      await this.events.log(input.session, "upsell_shown", {
        delayUnit: sequence.delayUnit ?? "minutes",
        delayValue: sequence.delayValue ?? sequence.delayMinutes,
        sequenceId: sequence.id,
      });
    }
  }
}
