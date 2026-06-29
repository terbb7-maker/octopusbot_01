import type { Json } from "@/types/database/json";

export type TelegramBotsTable = {
  Row: {
    id: string;
    workspace_id: string;
    bot_username: string;
    bot_name: string | null;
    bot_token_encrypted: string;
    telegram_bot_external_id: number;
    webhook_secret_hash: string | null;
    webhook_status: "pending" | "active" | "failed" | "disabled";
    status: "active" | "disabled" | "revoked";
    last_verified_at: string | null;
    bot_avatar_path: string | null;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    workspace_id: string;
    bot_username: string;
    bot_name?: string | null;
    bot_token_encrypted: string;
    telegram_bot_external_id: number;
    webhook_secret_hash?: string | null;
    webhook_status?: "pending" | "active" | "failed" | "disabled";
    status?: "active" | "disabled" | "revoked";
    last_verified_at?: string | null;
    bot_avatar_path?: string | null;
  };
  Update: {
    bot_username?: string;
    bot_name?: string | null;
    bot_token_encrypted?: string;
    telegram_bot_external_id?: number;
    webhook_secret_hash?: string | null;
    webhook_status?: "pending" | "active" | "failed" | "disabled";
    status?: "active" | "disabled" | "revoked";
    last_verified_at?: string | null;
    bot_avatar_path?: string | null;
    deleted_at?: string | null;
  };
  Relationships: [];
};

export type TelegramChatsTable = {
  Row: {
    id: string;
    workspace_id: string;
    telegram_bot_id: string;
    telegram_chat_external_id: number;
    telegram_user_external_id: number | null;
    chat_type: "private" | "group" | "supergroup" | "channel" | null;
    title: string | null;
    username: string | null;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    state: string | null;
    language_code: string | null;
    last_message_at: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    workspace_id: string;
    telegram_bot_id: string;
    telegram_chat_external_id: number;
    telegram_user_external_id?: number | null;
    chat_type?: "private" | "group" | "supergroup" | "channel" | null;
    title?: string | null;
    username?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
    state?: string | null;
    language_code?: string | null;
    last_message_at?: string | null;
  };
  Update: {
    telegram_user_external_id?: number | null;
    chat_type?: "private" | "group" | "supergroup" | "channel" | null;
    title?: string | null;
    username?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone?: string | null;
    city?: string | null;
    state?: string | null;
    language_code?: string | null;
    last_message_at?: string | null;
  };
  Relationships: [];
};

export type TelegramEventsTable = {
  Row: {
    id: string;
    workspace_id: string;
    telegram_bot_id: string;
    telegram_chat_id: string | null;
    update_id: number;
    event_type: string;
    payload: Json;
    processing_status: "received" | "processing" | "processed" | "ignored" | "failed";
    processed_at: string | null;
    error_message: string | null;
    created_at: string;
  };
  Insert: {
    workspace_id: string;
    telegram_bot_id: string;
    telegram_chat_id?: string | null;
    update_id: number;
    event_type: string;
    payload: Json;
    processing_status?: "received" | "processing" | "processed" | "ignored" | "failed";
  };
  Update: Record<string, never>;
  Relationships: [];
};
