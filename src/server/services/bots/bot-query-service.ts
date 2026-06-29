import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getAuthenticatedWorkspace,
  type SupabaseServer,
} from "@/server/services/bots/bot-context";
import { signedAvatarUrl } from "@/server/services/bots/bot-storage";
import {
  MAX_BOTS_PER_WORKSPACE,
  type BotListItem,
  type BotsOverview,
} from "@/server/services/bots/types";
import type { Database } from "@/types/database";

type BotRow = Database["public"]["Tables"]["telegram_bots"]["Row"];
type ChatRow = Pick<
  Database["public"]["Tables"]["telegram_chats"]["Row"],
  "telegram_bot_id" | "last_message_at" | "created_at"
>;
type BindingRow = Pick<
  Database["public"]["Tables"]["flow_bot_bindings"]["Row"],
  "telegram_bot_id" | "flow_id" | "status"
>;
type FlowRow = Pick<Database["public"]["Tables"]["flows"]["Row"], "id" | "name">;

function latestDate(...values: Array<string | null | undefined>) {
  const timestamps = values
    .filter((value): value is string => Boolean(value))
    .map((value) => new Date(value).getTime());

  return timestamps.length ? new Date(Math.max(...timestamps)).toISOString() : null;
}

function countByBot<T extends { telegram_bot_id: string }>(rows: T[]) {
  return rows.reduce<Map<string, number>>((map, row) => {
    map.set(row.telegram_bot_id, (map.get(row.telegram_bot_id) ?? 0) + 1);
    return map;
  }, new Map());
}

async function fetchBotRows(supabase: SupabaseServer, workspaceId: string) {
  return Promise.all([
    supabase
      .from("telegram_bots")
      .select(
        "id,workspace_id,bot_username,bot_name,telegram_bot_external_id,webhook_status,status,last_verified_at,bot_avatar_path,created_at,updated_at",
      )
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
    supabase
      .from("telegram_chats")
      .select("telegram_bot_id,last_message_at,created_at")
      .eq("workspace_id", workspaceId),
    supabase
      .from("flow_bot_bindings")
      .select("telegram_bot_id,flow_id,status")
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .is("deleted_at", null),
    supabase
      .from("flows")
      .select("id,name")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null),
  ]);
}

export async function getBotsOverview(): Promise<BotsOverview> {
  const supabase = await createSupabaseServerClient();
  const { workspaceId } = await getAuthenticatedWorkspace(supabase);

  if (!workspaceId) {
    return {
      bots: [],
      totalBots: 0,
      activeBots: 0,
      inactiveBots: 0,
      limit: MAX_BOTS_PER_WORKSPACE,
    };
  }

  const [{ data: bots }, { data: chats }, { data: bindings }, { data: flows }] = await fetchBotRows(
    supabase,
    workspaceId,
  );
  const leadCounts = countByBot((chats ?? []) as ChatRow[]);
  const activity = new Map<string, string>();
  const flowNames = new Map(((flows ?? []) as FlowRow[]).map((flow) => [flow.id, flow.name]));
  const botBindings = new Map(
    ((bindings ?? []) as BindingRow[]).map((binding) => [
      binding.telegram_bot_id,
      binding.flow_id,
    ]),
  );

  ((chats ?? []) as ChatRow[]).forEach((chat) => {
    const date = latestDate(activity.get(chat.telegram_bot_id), chat.last_message_at, chat.created_at);
    if (date) activity.set(chat.telegram_bot_id, date);
  });

  const items = await Promise.all(
    ((bots ?? []) as BotRow[]).map(async (bot): Promise<BotListItem> => {
      const flowId = botBindings.get(bot.id) ?? null;

      return {
        id: bot.id,
        name: bot.bot_name ?? bot.bot_username,
        username: bot.bot_username,
        telegramBotId: bot.telegram_bot_external_id,
        status: bot.status,
        webhookStatus: bot.webhook_status,
        avatarUrl: await signedAvatarUrl(supabase, bot.bot_avatar_path),
        flowId,
        flowName: flowId ? flowNames.get(flowId) ?? "Fluxo conectado" : null,
        leads: leadCounts.get(bot.id) ?? 0,
        sales: 0,
        lastActivityAt: latestDate(activity.get(bot.id), bot.last_verified_at, bot.updated_at),
        createdAt: bot.created_at,
      };
    }),
  );

  return {
    bots: items,
    totalBots: items.length,
    activeBots: items.filter((bot) => bot.status === "active").length,
    inactiveBots: items.filter((bot) => bot.status !== "active").length,
    limit: MAX_BOTS_PER_WORKSPACE,
  };
}
