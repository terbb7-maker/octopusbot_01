import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getTelegramWebhookEnv } from "@/lib/security/env";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { TelegramRuntime } from "@/server/services/workflow-runtime/telegram-runtime";
import type { Json } from "@/types/database";

const paramsSchema = z.object({ botId: z.string().uuid() });
const telegramChatTypes = ["private", "group", "supergroup", "channel"] as const;

type TelegramChatType = (typeof telegramChatTypes)[number];

function detectEventType(payload: Json) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return "unknown";
  }

  if ("message" in payload) return "message";
  if ("edited_message" in payload) return "edited_message";
  if ("channel_post" in payload) return "channel_post";
  if ("edited_channel_post" in payload) return "edited_channel_post";
  if ("callback_query" in payload) return "callback_query";
  if ("my_chat_member" in payload) return "my_chat_member";

  return "unknown";
}

function readUpdateId(payload: Json) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const updateId = payload.update_id;

  return typeof updateId === "number" ? updateId : null;
}

function readRecord(value: unknown): Record<string, Json> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json>)
    : null;
}

function readTelegramChatType(value: unknown): TelegramChatType | null {
  return typeof value === "string"
    && (telegramChatTypes as readonly string[]).includes(value)
    ? (value as TelegramChatType)
    : null;
}

function readTelegramChat(payload: Json) {
  const root = readRecord(payload);
  const message = readRecord(root?.message);
  const editedMessage = readRecord(root?.edited_message);
  const channelPost = readRecord(root?.channel_post);
  const editedChannelPost = readRecord(root?.edited_channel_post);
  const callback = readRecord(root?.callback_query);
  const callbackMessage = readRecord(callback?.message);
  const myChatMember = readRecord(root?.my_chat_member);
  const chat = readRecord(
    message?.chat
      ?? editedMessage?.chat
      ?? channelPost?.chat
      ?? editedChannelPost?.chat
      ?? callbackMessage?.chat
      ?? myChatMember?.chat,
  );
  const from = readRecord(
    message?.from
      ?? editedMessage?.from
      ?? channelPost?.from
      ?? editedChannelPost?.from
      ?? callback?.from
      ?? myChatMember?.from,
  );

  if (!chat || typeof chat.id !== "number") {
    return null;
  }

  return {
    chatExternalId: chat.id,
    chatType: readTelegramChatType(chat.type),
    firstName: typeof chat.first_name === "string" ? chat.first_name : null,
    languageCode:
      typeof from?.language_code === "string" ? from.language_code : null,
    lastName: typeof chat.last_name === "string" ? chat.last_name : null,
    telegramUserExternalId: typeof from?.id === "number" ? from.id : null,
    title: typeof chat.title === "string" ? chat.title : null,
    username: typeof chat.username === "string" ? chat.username : null,
  };
}

function readTelegramMessageText(payload: Json) {
  const root = readRecord(payload);
  const message = readRecord(root?.message);
  const text = message?.text;

  return typeof text === "string" ? text.trim() : null;
}

function readTelegramCallbackData(payload: Json) {
  const root = readRecord(payload);
  const callback = readRecord(root?.callback_query);
  const data = callback?.data;

  return typeof data === "string" ? data : null;
}

function readTelegramCallbackId(payload: Json) {
  const root = readRecord(payload);
  const callback = readRecord(root?.callback_query);
  const id = callback?.id;

  return typeof id === "string" ? id : null;
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ botId: string }> },
) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");

  if (secret !== getTelegramWebhookEnv().telegramWebhookSecret) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const params = paramsSchema.safeParse(await context.params);

  if (!params.success) {
    return NextResponse.json({ ok: false }, { status: 404 });
  }

  const payload = (await request.json().catch(() => null)) as Json;
  const updateId = readUpdateId(payload);

  if (updateId === null) {
    return NextResponse.json({ ok: false }, { status: 422 });
  }

  const admin = getSupabaseServiceRoleClient();
  const { data: bot } = await admin
    .from("telegram_bots")
    .select("id,workspace_id,status,deleted_at")
    .eq("id", params.data.botId)
    .maybeSingle();

  if (!bot || bot.status !== "active" || bot.deleted_at) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const eventType = detectEventType(payload);
  const chat = readTelegramChat(payload);
  let telegramChatId: string | null = null;

  if (chat) {
    const { data: chatRow } = await admin
      .from("telegram_chats")
      .upsert(
        {
          workspace_id: bot.workspace_id,
          telegram_bot_id: bot.id,
          telegram_chat_external_id: chat.chatExternalId,
          telegram_user_external_id: chat.telegramUserExternalId,
          chat_type: chat.chatType,
          title: chat.title,
          username: chat.username,
          first_name: chat.firstName,
          last_name: chat.lastName,
          language_code: chat.languageCode,
          last_message_at: new Date().toISOString(),
        },
        { onConflict: "telegram_bot_id,telegram_chat_external_id" },
      )
      .select("id")
      .maybeSingle();

    telegramChatId = chatRow?.id ?? null;
  }

  await admin.from("webhook_inbox").upsert(
    {
      workspace_id: bot.workspace_id,
      source: "telegram",
      external_id: `${bot.id}:${updateId}`,
      event_type: eventType,
      payload,
      headers: {
        "user-agent": request.headers.get("user-agent"),
      },
      processing_status: "received",
    },
    { onConflict: "source,external_id", ignoreDuplicates: true },
  );
  await admin.from("telegram_events").upsert(
    {
      workspace_id: bot.workspace_id,
      telegram_bot_id: bot.id,
      telegram_chat_id: telegramChatId,
      update_id: updateId,
      event_type: eventType,
      payload,
      processing_status: "received",
    },
    { onConflict: "telegram_bot_id,update_id", ignoreDuplicates: true },
  );

  const messageText = readTelegramMessageText(payload);
  const callbackData = readTelegramCallbackData(payload);
  const callbackQueryId = readTelegramCallbackId(payload);

  if ((messageText?.startsWith("/start") || callbackData) && chat) {
    const runtime = new TelegramRuntime(admin);

    await runtime.handleUpdate({
      botId: bot.id,
      callbackData,
      callbackQueryId,
      lead: {
        chatExternalId: chat.chatExternalId,
        chatId: telegramChatId,
        firstName: chat.firstName,
        languageCode: chat.languageCode,
        lastName: chat.lastName,
        telegramUserExternalId: chat.telegramUserExternalId,
        username: chat.username,
      },
      messageText,
      workspaceId: bot.workspace_id,
    });
  }

  return NextResponse.json({ ok: true });
}
