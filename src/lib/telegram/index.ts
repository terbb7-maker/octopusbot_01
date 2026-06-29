export type TelegramWebhookResult = {
  received: true;
  source: "telegram";
};

export function createTelegramWebhookResult(): TelegramWebhookResult {
  return {
    received: true,
    source: "telegram",
  };
}
