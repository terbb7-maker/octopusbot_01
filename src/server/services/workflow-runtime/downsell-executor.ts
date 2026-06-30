import { sendTelegramMessage } from "@/server/adapters/telegram/telegram-adapter";
import type { TelegramInlineKeyboardMarkup } from "@/server/adapters/telegram/types";
import { EventLogger } from "@/server/services/workflow-runtime/event-logger";
import { MediaRenderer } from "@/server/services/workflow-runtime/media-renderer";
import type {
  RuntimeConfig,
  RuntimeSession,
  RuntimeSupabase,
} from "@/server/services/workflow-runtime/types";
import { VariableResolver } from "@/server/services/workflow-runtime/variable-resolver";

export class DownsellExecutor {
  private readonly events: EventLogger;
  private readonly media = new MediaRenderer();

  constructor(supabase: RuntimeSupabase) {
    this.events = new EventLogger(supabase);
  }

  private async wait(sequence: RuntimeConfig["graph"]["downsells"][number]) {
    const value = sequence.delayValue ?? sequence.delayMinutes ?? 0;
    const unit = sequence.delayUnit ?? "minutes";
    const ms = unit === "seconds" ? value * 1000 : value * 60 * 1000;

    if (ms > 0) {
      await new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  private firstPlanId(sequence: RuntimeConfig["graph"]["downsells"][number]) {
    return sequence.exclusivePlans?.[0]?.id ?? sequence.planId ?? "";
  }

  async execute(input: {
    config: RuntimeConfig;
    resolver: VariableResolver;
    session: RuntimeSession;
  }) {
    const sequences = input.config.graph.downsells.slice(0, 20);

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
      const replyMarkup: TelegramInlineKeyboardMarkup | undefined = planId
        ? {
          inline_keyboard: [[
            {
              callback_data: `downsell:${sequence.id}:${planId}`,
              text: sequence.button.label,
            },
          ]],
        }
        : undefined;

      await sendTelegramMessage({
        chatId: Number(input.session.telegram_chat_external_id),
        replyMarkup,
        text: input.resolver.render(sequence.message),
        token: input.config.bot.token,
      });

      await this.events.log(input.session, "downsell_sent", {
        delayUnit: sequence.delayUnit ?? "minutes",
        delayValue: sequence.delayValue ?? sequence.delayMinutes,
        sequenceId: sequence.id,
      });
    }
  }
}
