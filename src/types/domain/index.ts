export type WorkspaceRole = "owner" | "admin" | "member" | "viewer";

export type TelegramBotStatus = "active" | "disabled" | "revoked";

export type TelegramWebhookStatus =
  | "pending"
  | "active"
  | "failed"
  | "disabled";

export type { FlowKind, FlowStatus } from "@/types/domain/flows";

export type PaymentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "cancelled"
  | "expired"
  | "refunded"
  | "failed";
