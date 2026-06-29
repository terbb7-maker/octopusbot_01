export type PaymentWebhookResult = {
  received: true;
  source: "payment_provider";
};

export function createPaymentWebhookResult(): PaymentWebhookResult {
  return {
    received: true,
    source: "payment_provider",
  };
}
