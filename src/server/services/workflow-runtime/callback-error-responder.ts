import { sendTelegramMessage } from "@/server/adapters/telegram/telegram-adapter";
import { FlowRuntime } from "@/server/services/workflow-runtime/flow-runtime";
import { runtimeLog } from "@/server/services/workflow-runtime/runtime-logger";
import type { RuntimeUpdate } from "@/server/services/workflow-runtime/types";

export class CallbackErrorResponder {
  private readonly flowRuntime = new FlowRuntime();

  constructor(
    private readonly answer: (
      update: RuntimeUpdate,
      token: string,
      text?: string,
    ) => Promise<void>,
  ) {}

  async handleMissingSession(update: RuntimeUpdate) {
    const config = await this.flowRuntime.loadPublishedConfig(
      update.botId,
      update.workspaceId,
    );

    runtimeLog("Erro encontrado: sessao ativa nao localizada", {
      botId: update.botId,
      callbackData: update.callbackData,
      chatExternalId: update.lead.chatExternalId,
    });

    if (!config) return;

    await this.answer(
      update,
      config.bot.token,
      "Fluxo expirado. Envie /start novamente.",
    ).catch(() => null);
    await sendTelegramMessage({
      chatId: update.lead.chatExternalId,
      text: "Não foi possível localizar sua sessão. Envie /start e tente novamente.",
      token: config.bot.token,
    });
  }

  async handleMissingConfig(update: RuntimeUpdate) {
    const config = await this.flowRuntime.loadPublishedConfig(
      update.botId,
      update.workspaceId,
    );

    runtimeLog("Erro encontrado: configuracao publicada nao localizada", {
      botId: update.botId,
      callbackData: update.callbackData,
      chatExternalId: update.lead.chatExternalId,
    });

    if (!config) return;

    await this.answer(update, config.bot.token, "Fluxo indisponivel.").catch(
      () => null,
    );
    await sendTelegramMessage({
      chatId: update.lead.chatExternalId,
      text: "Não foi possível carregar este fluxo. Tente novamente em instantes.",
      token: config.bot.token,
    });
  }

  async sendFriendlyError(update: RuntimeUpdate) {
    const config = await this.flowRuntime.loadPublishedConfig(
      update.botId,
      update.workspaceId,
    ).catch(() => null);

    if (!config) return;

    await this.answer(update, config.bot.token, "Erro ao processar clique.").catch(
      () => null,
    );
    await sendTelegramMessage({
      chatId: update.lead.chatExternalId,
      text: "Erro ao gerar pagamento. Tente novamente.",
      token: config.bot.token,
    });
  }
}
