import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  FlowDelivery,
  FlowDownsellSequence,
  FlowInitialConfig,
  FlowMessagesConfig,
  FlowOrderBumps,
  FlowPlan,
  FlowPlanDefaultDelivery,
  FlowUpsellSequence,
} from "@/server/services/flows";
import type { Database, Json } from "@/types/database";

export type RuntimeSupabase = SupabaseClient<Database>;

export type RuntimeGraph = {
  deliveries: FlowDelivery[];
  downsells: FlowDownsellSequence[];
  initialConfig: FlowInitialConfig;
  messages: FlowMessagesConfig | null;
  orderBumps: FlowOrderBumps | null;
  planDefaultDelivery: FlowPlanDefaultDelivery | null;
  planMessage: string;
  plans: FlowPlan[];
  upsells: FlowUpsellSequence[];
};

export type RuntimeBot = {
  id: string;
  name: string;
  token: string;
  username: string;
  workspaceId: string;
};

export type RuntimeConfig = {
  bot: RuntimeBot;
  bindingId: string;
  deploymentId: string;
  flowId: string;
  graph: RuntimeGraph;
  signature: string;
  variantId: string;
  versionId: string;
  workspaceId: string;
};

export type TelegramLeadContext = {
  chatExternalId: number;
  chatId: string | null;
  city?: string | null;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  languageCode?: string | null;
  phone?: string | null;
  state?: string | null;
  telegramUserExternalId?: number | null;
  username?: string | null;
};

export type RuntimeUpdate = {
  botId: string;
  callbackData?: string | null;
  callbackQueryId?: string | null;
  lead: TelegramLeadContext;
  messageText?: string | null;
  workspaceId: string;
};

export type RuntimeSession = Database["public"]["Tables"]["flow_sessions"]["Row"];
export type RuntimeCheckout = Database["public"]["Tables"]["flow_checkouts"]["Row"];

export type RuntimeEventType =
  | "conversation_started"
  | "flow_started"
  | "cta_clicked"
  | "plan_selected"
  | "order_bump_shown"
  | "order_bump_accepted"
  | "order_bump_declined"
  | "checkout_created"
  | "pix_created"
  | "pix_paid"
  | "delivery_completed"
  | "upsell_shown"
  | "upsell_paid"
  | "downsell_sent"
  | "downsell_paid"
  | "conversation_finished";

export type PaymentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired"
  | "refunded"
  | "failed";

export type PixPayment = {
  copyPaste: string;
  expiresAt: string;
  paymentId: string;
  qrCode: string;
  qrCodeBase64: string | null;
  status: PaymentStatus;
  transactionId?: string;
};

export type PaymentProvider = {
  cancelPix(paymentId: string): Promise<void>;
  createPix(input: {
    checkoutId: string;
    currency: "BRL";
    flowId: string;
    planId: string;
    sessionId: string;
    totalCents: number;
    workspaceId: string;
  }): Promise<PixPayment>;
  getStatus(paymentId: string): Promise<PaymentStatus>;
};

export function jsonRecord(value: Json | undefined): Record<string, Json> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json>)
    : {};
}

export function toJson(value: unknown): Json {
  return value as Json;
}
