import type {
  TelegramBotStatus,
  TelegramWebhookStatus,
} from "@/types/domain";

export const MAX_BOTS_PER_WORKSPACE = 50;

export type BotListItem = {
  id: string;
  name: string;
  username: string;
  telegramBotId: number;
  status: TelegramBotStatus;
  webhookStatus: TelegramWebhookStatus;
  avatarUrl: string | null;
  flowId: string | null;
  flowName: string | null;
  leads: number;
  sales: number;
  lastActivityAt: string | null;
  createdAt: string;
};

export type BotsOverview = {
  bots: BotListItem[];
  totalBots: number;
  activeBots: number;
  inactiveBots: number;
  limit: number;
};

export type BotActionResult = {
  ok: boolean;
  message: string;
};
