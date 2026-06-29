import { sendTelegramMessage } from "@/server/adapters/telegram/telegram-adapter";
import { CallbackRuntime } from "@/server/services/workflow-runtime/callback-runtime";
import { ConversationRuntime } from "@/server/services/workflow-runtime/conversation-runtime";
import { EventLogger } from "@/server/services/workflow-runtime/event-logger";
import { FlowRuntime } from "@/server/services/workflow-runtime/flow-runtime";
import { MediaRenderer } from "@/server/services/workflow-runtime/media-renderer";
import { PlanExecutor } from "@/server/services/workflow-runtime/plan-executor";
import { runtimeLog } from "@/server/services/workflow-runtime/runtime-logger";
import type {
  RuntimeConfig,
  RuntimeSupabase,
  RuntimeUpdate,
} from "@/server/services/workflow-runtime/types";
import { VariableResolver } from "@/server/services/workflow-runtime/variable-resolver";

function ctaKeyboard(config: RuntimeConfig) {
  const cta = config.graph.initialConfig.cta;
  if (!cta?.enabled) return undefined;

  const text = cta.label || "Comecar Agora";

  if (cta.action === "open_link" && cta.url) {
    return { inline_keyboard: [[{ text, url: cta.url }]] };
  }

  return {
    inline_keyboard: [[
      {
        callback_data:
          cta.action === "send_message" ? "cta:send_message" : "cta:show_plans",
        text,
      },
    ]],
  };
}

export class TelegramRuntime {
  private readonly callbacks: CallbackRuntime;
  private readonly conversation: ConversationRuntime;
  private readonly events: EventLogger;
  private readonly flowRuntime = new FlowRuntime();
  private readonly media = new MediaRenderer();
  private readonly plans = new PlanExecutor();

  constructor(supabase: RuntimeSupabase) {
    this.callbacks = new CallbackRuntime(supabase);
    this.conversation = new ConversationRuntime(supabase);
    this.events = new EventLogger(supabase);
  }

  async handleUpdate(update: RuntimeUpdate) {
    if (update.messageText?.startsWith("/start")) {
      runtimeLog("Dispatcher recebeu message /start", {
        botId: update.botId,
        chatExternalId: update.lead.chatExternalId,
        workspaceId: update.workspaceId,
      });
      return this.start(update);
    }

    if (update.callbackData) {
      runtimeLog("Dispatcher recebeu callback_query", {
        botId: update.botId,
        callbackData: update.callbackData,
        chatExternalId: update.lead.chatExternalId,
        workspaceId: update.workspaceId,
      });
      return this.callbacks.handle(update);
    }

    return { ignored: true, ok: true };
  }

  private async start(update: RuntimeUpdate) {
    const config = await this.flowRuntime.loadPublishedConfig(
      update.botId,
      update.workspaceId,
    );

    if (!config) return { message: "Fluxo publicado nao encontrado.", ok: false };

    const lead = await this.conversation.loadLeadContext({
      botId: update.botId,
      chatExternalId: update.lead.chatExternalId,
      fallback: update.lead,
      workspaceId: update.workspaceId,
    });
    const session = await this.conversation.startSession(config, lead);
    const resolver = new VariableResolver(config, lead);
    const ctaEnabled = Boolean(config.graph.initialConfig.cta?.enabled);

    await this.events.log(session, "conversation_started", {
      telegramChatId: lead.chatExternalId,
    });
    await this.events.log(session, "flow_started", {
      flowId: config.flowId,
      versionId: config.versionId,
    });

    await this.media.sendInitialMedia({
      chatId: lead.chatExternalId,
      media: config.graph.initialConfig.media,
      token: config.bot.token,
    });

    await sendTelegramMessage({
      chatId: lead.chatExternalId,
      replyMarkup: ctaEnabled ? ctaKeyboard(config) : undefined,
      text: resolver.render(
        config.graph.initialConfig.html || config.graph.initialConfig.message,
      ),
      token: config.bot.token,
    });

    if (!ctaEnabled) {
      await this.conversation.updateSession(session, { current_step: "plans" });
      await this.plans.sendPlans(config, session);
    }

    return { ok: true };
  }
}
