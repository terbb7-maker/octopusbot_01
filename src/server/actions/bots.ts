"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  createBot,
  deleteBot,
  setBotStatus,
  updateBot,
  type BotActionResult,
} from "@/server/services/bots";

const tokenSchema = z
  .string()
  .trim()
  .regex(/^\d{6,14}:[A-Za-z0-9_-]{30,}$/, "Token do Telegram invalido.");
const idSchema = z.string().uuid("Bot invalido.");

function result(ok: boolean, message: string): BotActionResult {
  return { ok, message };
}

function revalidateBots(actionResult: BotActionResult) {
  if (actionResult.ok) {
    revalidatePath("/bots");
    revalidatePath("/dashboard");
  }

  return actionResult;
}

export async function createBotAction(token: string) {
  const parsed = tokenSchema.safeParse(token);

  if (!parsed.success) {
    return result(false, parsed.error.issues[0]?.message ?? "Token invalido.");
  }

  try {
    return revalidateBots(await createBot(parsed.data));
  } catch (error) {
    return result(
      false,
      error instanceof Error ? error.message : "Nao foi possivel criar o bot.",
    );
  }
}

export async function updateBotAction(botId: string, token: string) {
  const parsed = z
    .object({ botId: idSchema, token: tokenSchema })
    .safeParse({ botId, token });

  if (!parsed.success) {
    return result(false, parsed.error.issues[0]?.message ?? "Dados invalidos.");
  }

  try {
    return revalidateBots(await updateBot(parsed.data.botId, parsed.data.token));
  } catch (error) {
    return result(
      false,
      error instanceof Error ? error.message : "Nao foi possivel atualizar o bot.",
    );
  }
}

export async function pauseBotAction(botId: string) {
  const parsed = idSchema.safeParse(botId);

  if (!parsed.success) return result(false, "Bot invalido.");

  return revalidateBots(await setBotStatus(parsed.data, "disabled"));
}

export async function resumeBotAction(botId: string) {
  const parsed = idSchema.safeParse(botId);

  if (!parsed.success) return result(false, "Bot invalido.");

  return revalidateBots(await setBotStatus(parsed.data, "active"));
}

export async function deleteBotAction(botId: string) {
  const parsed = idSchema.safeParse(botId);

  if (!parsed.success) return result(false, "Bot invalido.");

  return revalidateBots(await deleteBot(parsed.data));
}
