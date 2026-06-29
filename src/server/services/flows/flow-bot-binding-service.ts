import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthenticatedFlowWorkspace } from "@/server/services/flows/flow-context";

export async function updateFlowBotBindings(flowId: string, botIds: string[]) {
  const supabase = await createSupabaseServerClient();
  const { userId, workspaceId } = await getAuthenticatedFlowWorkspace(supabase);

  if (!workspaceId) {
    return { ok: false, message: "Workspace nao encontrado." };
  }

  const uniqueBotIds = Array.from(new Set(botIds));
  const { data: flow } = await supabase
    .from("flows")
    .select("id")
    .eq("id", flowId)
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!flow) return { ok: false, message: "Fluxo nao encontrado." };

  if (uniqueBotIds.length) {
    const { data: bots } = await supabase
      .from("telegram_bots")
      .select("id")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .in("id", uniqueBotIds);

    if ((bots ?? []).length !== uniqueBotIds.length) {
      return { ok: false, message: "Um ou mais bots sao invalidos." };
    }
  }

  const now = new Date().toISOString();

  const { data: currentFlowBindings } = await supabase
    .from("flow_bot_bindings")
    .select("id,telegram_bot_id")
    .eq("workspace_id", workspaceId)
    .eq("flow_id", flowId)
    .eq("status", "active")
    .is("deleted_at", null);

  const currentBotIds = new Set(
    (currentFlowBindings ?? []).map((binding) => binding.telegram_bot_id),
  );
  const selectedBotIds = new Set(uniqueBotIds);
  const removedBindingIds = (currentFlowBindings ?? [])
    .filter((binding) => !selectedBotIds.has(binding.telegram_bot_id))
    .map((binding) => binding.id);

  if (removedBindingIds.length) {
    const { error } = await supabase
      .from("flow_bot_bindings")
      .update({
        deleted_at: now,
        status: "archived",
        updated_by: userId,
      })
      .in("id", removedBindingIds)
      .eq("workspace_id", workspaceId);

    if (error) return { ok: false, message: "Nao foi possivel remover vinculos." };
  }

  if (uniqueBotIds.length) {
    const { error } = await supabase
      .from("flow_bot_bindings")
      .update({
        deleted_at: now,
        status: "archived",
        updated_by: userId,
      })
      .in("telegram_bot_id", uniqueBotIds)
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .is("deleted_at", null)
      .neq("flow_id", flowId);

    if (error) return { ok: false, message: "Nao foi possivel trocar vinculos." };
  }

  const newBotIds = uniqueBotIds.filter((botId) => !currentBotIds.has(botId));

  if (newBotIds.length) {
    const { error } = await supabase.from("flow_bot_bindings").insert(
      newBotIds.map((botId) => ({
        created_by: userId,
        entrypoint: "default",
        flow_id: flowId,
        status: "active" as const,
        telegram_bot_id: botId,
        trigger_config: {},
        updated_by: userId,
        workspace_id: workspaceId,
      })),
    );

    if (error) return { ok: false, message: "Nao foi possivel vincular bots." };
  }

  return { ok: true, message: "Bots vinculados ao fluxo." };
}
