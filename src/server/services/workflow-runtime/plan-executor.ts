import { sendTelegramMessage } from "@/server/adapters/telegram/telegram-adapter";
import type { TelegramInlineKeyboardMarkup } from "@/server/adapters/telegram/types";
import type { FlowPlan } from "@/server/services/flows";
import type {
  RuntimeConfig,
  RuntimeSession,
} from "@/server/services/workflow-runtime/types";

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(cents / 100);
}

function plansKeyboard(plans: FlowPlan[]): TelegramInlineKeyboardMarkup | undefined {
  const buttons = plans.slice(0, 10).map((plan) => [
    {
      callback_data: `plan:${plan.id}`,
      text: plan.buttonLabel || plan.name || "Escolher plano",
    },
  ]);

  return buttons.length ? { inline_keyboard: buttons } : undefined;
}

export class PlanExecutor {
  activePlans(config: RuntimeConfig) {
    return config.graph.plans
      .filter((plan) => plan.active !== false)
      .sort((a, b) => a.order - b.order)
      .slice(0, 10);
  }

  findPlan(config: RuntimeConfig, planId: string) {
    return this.activePlans(config).find((plan) => plan.id === planId) ?? null;
  }

  async sendPlans(config: RuntimeConfig, session: RuntimeSession) {
    const plans = this.activePlans(config);
    const text = plans.length
      ? [
        "<b>Planos disponiveis</b>",
        "",
        ...plans.map((plan, index) => {
          return `${index + 1}. <b>${plan.name}</b> - ${money(plan.priceCents)}`;
        }),
      ].join("\n")
      : "Nenhum plano disponivel.";

    await sendTelegramMessage({
      chatId: Number(session.telegram_chat_external_id),
      replyMarkup: plansKeyboard(plans),
      text,
      token: config.bot.token,
    });
  }
}
