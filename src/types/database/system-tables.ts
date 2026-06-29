import type { Json } from "@/types/database/json";

type ProcessingStatus =
  | "received"
  | "processing"
  | "processed"
  | "ignored"
  | "failed";

export type AuditLogsTable = {
  Row: {
    id: string;
    workspace_id: string;
    actor_id: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    metadata: Json;
    created_at: string;
  };
  Insert: {
    workspace_id: string;
    actor_id?: string | null;
    action: string;
    entity_type: string;
    entity_id?: string | null;
    metadata?: Json;
  };
  Update: Record<string, never>;
  Relationships: [];
};

export type WebhookInboxTable = {
  Row: {
    id: string;
    workspace_id: string | null;
    source: "telegram" | "payment_provider";
    external_id: string;
    event_type: string | null;
    payload: Json;
    headers: Json | null;
    processing_status: ProcessingStatus;
    processed_at: string | null;
    error_message: string | null;
    created_at: string;
  };
  Insert: {
    workspace_id?: string | null;
    source: "telegram" | "payment_provider";
    external_id: string;
    event_type?: string | null;
    payload: Json;
    headers?: Json | null;
    processing_status?: ProcessingStatus;
  };
  Update: Record<string, never>;
  Relationships: [];
};
