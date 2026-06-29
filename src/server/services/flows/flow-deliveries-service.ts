import { randomUUID } from "crypto";

import { decryptSecret } from "@/lib/security/encryption";
import { getTelegramBotTokenEnv } from "@/lib/security/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import { getTelegramChatMemberStatus } from "@/server/adapters/telegram/telegram-adapter";
import { getAuthenticatedFlowWorkspace } from "@/server/services/flows/flow-context";
import type {
  FlowDelivery,
  FlowDeliveryFile,
  TelegramDeliveryDestination,
} from "@/server/services/flows/types";
import type { Json } from "@/types/database";

const FLOW_MEDIA_BUCKET = "flow-media";

type DraftVersionRow = {
  id: string;
  graph_json: Json;
};

type BotRow = {
  id: string;
  bot_name: string | null;
  bot_username: string;
  bot_token_encrypted: string;
  telegram_bot_external_id: number;
};

type ChatRow = {
  id: string;
  telegram_bot_id: string;
  telegram_chat_external_id: number;
  chat_type: "group" | "supergroup" | "channel" | "private" | null;
  title: string | null;
  username: string | null;
};

function jsonRecord(value: Json): Record<string, Json> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json>)
    : {};
}

function toJson(value: unknown): Json {
  return value as Json;
}

async function getEditableDraftVersion(flowId: string) {
  const supabase = await createSupabaseServerClient();
  const { workspaceId } = await getAuthenticatedFlowWorkspace(supabase);

  if (!workspaceId) return { supabase, workspaceId: null, version: null };

  const { data } = await supabase
    .from("flow_versions")
    .select("id,graph_json")
    .eq("flow_id", flowId)
    .eq("workspace_id", workspaceId)
    .eq("status", "draft")
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    supabase,
    workspaceId,
    version: (data ?? null) as DraftVersionRow | null,
  };
}

export async function saveFlowDeliveries(
  flowId: string,
  deliveries: FlowDelivery[],
) {
  const { supabase, version, workspaceId } = await getEditableDraftVersion(flowId);

  if (!workspaceId || !version) {
    return { ok: false, message: "Versao draft nao encontrada." };
  }

  const graph = jsonRecord(version.graph_json);
  const nextGraph = {
    ...graph,
    deliveries,
    updatedAt: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("flow_versions")
    .update({
      graph_json: toJson(nextGraph),
      compiled_graph_json: toJson(nextGraph),
      validation_status: "pending",
    })
    .eq("id", version.id)
    .eq("workspace_id", workspaceId);

  return {
    ok: !error,
    message: error ? "Nao foi possivel salvar as entregas." : "Entregas salvas.",
  };
}

function extensionFor(file: File) {
  const [, subtype = "bin"] = file.type.split("/");

  return subtype.replace("jpeg", "jpg").replace("mpeg", "mp3");
}

export async function uploadFlowDeliveryFile({
  deliveryId,
  file,
  flowId,
}: {
  deliveryId: string;
  file: File;
  flowId: string;
}) {
  const { supabase, workspaceId } = await getEditableDraftVersion(flowId);

  if (!workspaceId) {
    return { ok: false, message: "Versao draft nao encontrada." };
  }

  const path = `${workspaceId}/${flowId}/deliveries/${deliveryId}-${randomUUID()}.${extensionFor(file)}`;
  const { error } = await supabase.storage.from(FLOW_MEDIA_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return { ok: false, message: "Nao foi possivel enviar o arquivo." };

  const deliveryFile: FlowDeliveryFile = {
    name: file.name,
    path,
    type: file.type || "application/octet-stream",
  };
  const { data } = await supabase.storage
    .from(FLOW_MEDIA_BUCKET)
    .createSignedUrl(path, 60 * 60);

  return {
    file: {
      ...deliveryFile,
      signedUrl: data?.signedUrl ?? null,
    },
    message: "Arquivo enviado.",
    ok: true,
  };
}

function destinationId(botId: string, chatExternalId: number) {
  return `${botId}:${chatExternalId}`;
}

export async function getTelegramDeliveryDestinations() {
  const supabase = await createSupabaseServerClient();
  const { workspaceId } = await getAuthenticatedFlowWorkspace(supabase);

  if (!workspaceId) return [];

  const admin = getSupabaseServiceRoleClient();
  const [{ data: botsData }, { data: chatsData }] = await Promise.all([
    admin
      .from("telegram_bots")
      .select("id,bot_name,bot_username,bot_token_encrypted,telegram_bot_external_id")
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .is("deleted_at", null),
    admin
      .from("telegram_chats")
      .select("id,telegram_bot_id,telegram_chat_external_id,chat_type,title,username")
      .eq("workspace_id", workspaceId)
      .in("chat_type", ["group", "supergroup", "channel"]),
  ]);
  const bots = ((botsData ?? []) as BotRow[]).reduce<Map<string, BotRow>>(
    (map, bot) => map.set(bot.id, bot),
    new Map(),
  );
  const tokenSecret = getTelegramBotTokenEnv().telegramBotTokenEncryptionKey;
  const destinations: TelegramDeliveryDestination[] = [];

  for (const chat of (chatsData ?? []) as ChatRow[]) {
    const bot = bots.get(chat.telegram_bot_id);

    if (!bot || !chat.chat_type || chat.chat_type === "private") continue;

    try {
      const token = decryptSecret(bot.bot_token_encrypted, tokenSecret);
      const status = await getTelegramChatMemberStatus({
        chatId: chat.telegram_chat_external_id,
        token,
        userId: bot.telegram_bot_external_id,
      });

      if (!["administrator", "creator"].includes(status)) continue;

      destinations.push({
        id: destinationId(bot.id, chat.telegram_chat_external_id),
        botId: bot.id,
        botName: bot.bot_name ?? `@${bot.bot_username}`,
        chatExternalId: chat.telegram_chat_external_id,
        chatType: chat.chat_type,
        title: chat.title ?? chat.username ?? String(chat.telegram_chat_external_id),
        username: chat.username,
      });
    } catch {
      // Ignore chats the bot can no longer inspect.
    }
  }

  return destinations;
}
