import { createHash } from "crypto";

import { encryptSecret } from "@/lib/security/encryption";
import {
  getPublicEnv,
  getTelegramBotTokenEnv,
  getTelegramWebhookEnv,
} from "@/lib/security/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getTelegramBotProfile,
  setTelegramWebhook,
} from "@/server/adapters/telegram/telegram-adapter";
import {
  auditBotAction,
  getAuthenticatedWorkspace,
} from "@/server/services/bots/bot-context";
import { uploadAvatar } from "@/server/services/bots/bot-storage";
import {
  MAX_BOTS_PER_WORKSPACE,
  type BotActionResult,
} from "@/server/services/bots/types";

function hashSecret(secret: string) {
  return createHash("sha256").update(secret).digest("hex");
}

function isPublicAppUrl(appUrl: string) {
  return !appUrl.includes("localhost") && !appUrl.includes("127.0.0.1");
}

async function restoreDeletedBot({
  botId,
  token,
  workspaceId,
  encryptedToken,
  botUsername,
  botName,
  avatarPath,
}: {
  botId: string;
  token: string;
  workspaceId: string;
  encryptedToken: string;
  botUsername: string;
  botName: string;
  avatarPath: string | null;
}) {
  const supabase = await createSupabaseServerClient();
  const webhookStatus = await configureWebhook(botId, token);
  const { error } = await supabase
    .from("telegram_bots")
    .update({
      bot_username: botUsername,
      bot_name: botName,
      bot_token_encrypted: encryptedToken,
      webhook_status: webhookStatus,
      status: "active",
      last_verified_at: new Date().toISOString(),
      bot_avatar_path: avatarPath,
      deleted_at: null,
    })
    .eq("id", botId)
    .eq("workspace_id", workspaceId);

  return !error;
}

async function configureWebhook(botId: string, token: string) {
  const publicEnv = getPublicEnv();
  const webhookEnv = getTelegramWebhookEnv();

  if (!isPublicAppUrl(publicEnv.appUrl)) {
    return "pending" as const;
  }

  try {
    await setTelegramWebhook({
      botId,
      token,
      appUrl: publicEnv.appUrl,
      secretToken: webhookEnv.telegramWebhookSecret,
    });
    return "active" as const;
  } catch {
    return "failed" as const;
  }
}

export async function validateTelegramBotToken(token: string) {
  return getTelegramBotProfile(token);
}

export async function createBot(token: string): Promise<BotActionResult> {
  const supabase = await createSupabaseServerClient();
  const { userId, workspaceId } = await getAuthenticatedWorkspace(supabase);

  if (!workspaceId) return { ok: false, message: "Workspace nao encontrado." };

  const { count } = await supabase
    .from("telegram_bots")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null);

  if ((count ?? 0) >= MAX_BOTS_PER_WORKSPACE) {
    return { ok: false, message: "Limite de 50 bots por workspace atingido." };
  }

  const profile = await getTelegramBotProfile(token);
  const tokenEnv = getTelegramBotTokenEnv();
  const webhookEnv = getTelegramWebhookEnv();
  const avatarPath = await uploadAvatar(supabase, workspaceId, profile);
  const encryptedToken = encryptSecret(token.trim(), tokenEnv.telegramBotTokenEncryptionKey);
  const { data: existingBot } = await supabase
    .from("telegram_bots")
    .select("id,deleted_at")
    .eq("workspace_id", workspaceId)
    .eq("telegram_bot_external_id", profile.id)
    .maybeSingle();

  if (existingBot?.deleted_at) {
    const restored = await restoreDeletedBot({
      botId: existingBot.id,
      token,
      workspaceId,
      encryptedToken,
      botUsername: profile.username,
      botName: profile.name,
      avatarPath,
    });

    if (!restored) {
      return { ok: false, message: "Nao foi possivel reconectar o bot." };
    }

    await auditBotAction(
      supabase,
      workspaceId,
      userId,
      "telegram_bot.restored",
      existingBot.id,
    );

    return { ok: true, message: "Bot reconectado com sucesso." };
  }

  if (existingBot) {
    return { ok: false, message: "Este bot ja esta conectado ao workspace." };
  }

  const { data: bot, error } = await supabase
    .from("telegram_bots")
    .insert({
      workspace_id: workspaceId,
      bot_username: profile.username,
      bot_name: profile.name,
      bot_token_encrypted: encryptedToken,
      telegram_bot_external_id: profile.id,
      webhook_secret_hash: hashSecret(webhookEnv.telegramWebhookSecret),
      webhook_status: "pending",
      status: "active",
      last_verified_at: new Date().toISOString(),
      bot_avatar_path: avatarPath,
    })
    .select("id")
    .single();

  if (error || !bot) {
    return { ok: false, message: "Nao foi possivel salvar o bot." };
  }

  const webhookStatus = await configureWebhook(bot.id, token);
  await supabase
    .from("telegram_bots")
    .update({ webhook_status: webhookStatus })
    .eq("id", bot.id);
  await auditBotAction(supabase, workspaceId, userId, "telegram_bot.created", bot.id);

  return { ok: true, message: "Bot conectado com sucesso." };
}

export async function updateBot(botId: string, token: string): Promise<BotActionResult> {
  const supabase = await createSupabaseServerClient();
  const { userId, workspaceId } = await getAuthenticatedWorkspace(supabase);

  if (!workspaceId) return { ok: false, message: "Workspace nao encontrado." };

  const profile = await getTelegramBotProfile(token);
  const tokenEnv = getTelegramBotTokenEnv();
  const avatarPath = await uploadAvatar(supabase, workspaceId, profile);
  const webhookStatus = await configureWebhook(botId, token);
  const { error } = await supabase
    .from("telegram_bots")
    .update({
      bot_username: profile.username,
      bot_name: profile.name,
      bot_token_encrypted: encryptSecret(token.trim(), tokenEnv.telegramBotTokenEncryptionKey),
      telegram_bot_external_id: profile.id,
      webhook_status: webhookStatus,
      status: "active",
      last_verified_at: new Date().toISOString(),
      bot_avatar_path: avatarPath,
    })
    .eq("id", botId)
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null);

  if (error) return { ok: false, message: "Nao foi possivel atualizar o bot." };
  await auditBotAction(supabase, workspaceId, userId, "telegram_bot.updated", botId);

  return { ok: true, message: "Bot atualizado com sucesso." };
}

export async function setBotStatus(botId: string, status: "active" | "disabled") {
  const supabase = await createSupabaseServerClient();
  const { userId, workspaceId } = await getAuthenticatedWorkspace(supabase);

  if (!workspaceId) return { ok: false, message: "Workspace nao encontrado." };

  const { error } = await supabase
    .from("telegram_bots")
    .update({ status })
    .eq("id", botId)
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null);

  if (error) return { ok: false, message: "Nao foi possivel alterar o bot." };
  await auditBotAction(supabase, workspaceId, userId, `telegram_bot.${status}`, botId);

  return { ok: true, message: "Status do bot atualizado." };
}

export async function deleteBot(botId: string): Promise<BotActionResult> {
  const supabase = await createSupabaseServerClient();
  const { userId, workspaceId } = await getAuthenticatedWorkspace(supabase);

  if (!workspaceId) return { ok: false, message: "Workspace nao encontrado." };

  const { error } = await supabase
    .from("telegram_bots")
    .update({ status: "revoked", deleted_at: new Date().toISOString() })
    .eq("id", botId)
    .eq("workspace_id", workspaceId);

  if (error) return { ok: false, message: "Nao foi possivel excluir o bot." };
  await auditBotAction(supabase, workspaceId, userId, "telegram_bot.deleted", botId);

  return { ok: true, message: "Bot excluido com sucesso." };
}
