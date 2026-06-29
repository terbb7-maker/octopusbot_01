import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthenticatedFlowWorkspace } from "@/server/services/flows/flow-context";
import type {
  FlowBotOption,
  FlowListItem,
  FlowsOverview,
} from "@/server/services/flows/types";
import type { Json } from "@/types/database";

type FlowRow = {
  id: string;
  name: string;
  status: FlowListItem["status"];
  active_version_id: string | null;
  updated_at: string;
};

type BindingRow = {
  flow_id: string;
  telegram_bot_id: string;
  status: string;
};

type BotRow = {
  id: string;
  bot_name: string | null;
  bot_username: string;
  status: FlowBotOption["status"];
};

type VersionRow = {
  flow_id: string;
  graph_json: Json;
};

function jsonRecord(value: Json): Record<string, Json> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json>)
    : null;
}

function classifyFlow(version: VersionRow | undefined): FlowListItem["kind"] {
  const graph = version ? jsonRecord(version.graph_json) : null;
  const nodes = Array.isArray(graph?.nodes) ? graph.nodes : [];
  const hasAdvancedNode = nodes.some((node) => {
    const nodeRecord = jsonRecord(node as Json);
    const type = typeof nodeRecord?.type === "string" ? nodeRecord.type : "";

    return ["ai", "condition", "integration", "webhook"].includes(type);
  });

  return hasAdvancedNode || nodes.length > 5 ? "advanced" : "basic";
}

function countBindings(bindings: BindingRow[]) {
  return bindings.reduce<Map<string, number>>((map, binding) => {
    if (binding.status === "active") {
      map.set(binding.flow_id, (map.get(binding.flow_id) ?? 0) + 1);
    }

    return map;
  }, new Map());
}

export async function getFlowsOverview(): Promise<FlowsOverview> {
  const supabase = await createSupabaseServerClient();
  const { workspaceId } = await getAuthenticatedFlowWorkspace(supabase);

  if (!workspaceId) {
    return {
      flows: [],
      botOptions: [],
      linkedFlows: 0,
      basicFlows: 0,
      advancedFlows: 0,
    };
  }

  const { data: flowsData } = await supabase
    .from("flows")
    .select("id,name,status,active_version_id,updated_at")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("updated_at", { ascending: false });

  const flows = (flowsData ?? []) as FlowRow[];
  const flowIds = flows.map((flow) => flow.id);

  const [
    { data: bindingsData },
    { data: versionsData },
    { data: botsData },
  ] = await Promise.all([
    supabase
      .from("flow_bot_bindings")
      .select("flow_id,telegram_bot_id,status")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null),
    flowIds.length
      ? supabase
          .from("flow_versions")
          .select("flow_id,graph_json")
          .eq("workspace_id", workspaceId)
          .in("flow_id", flowIds)
          .order("version_number", { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase
      .from("telegram_bots")
      .select("id,bot_name,bot_username,status")
      .eq("workspace_id", workspaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }),
  ]);

  const bindings = countBindings((bindingsData ?? []) as BindingRow[]);
  const versions = new Map<string, VersionRow>();

  ((versionsData ?? []) as VersionRow[]).forEach((version) => {
    if (!versions.has(version.flow_id)) versions.set(version.flow_id, version);
  });

  const items = flows.map((flow): FlowListItem => ({
    id: flow.id,
    name: flow.name,
    kind: classifyFlow(versions.get(flow.id)),
    linkedBots: bindings.get(flow.id) ?? 0,
    status: flow.status,
    lastEditedAt: flow.updated_at,
  }));
  const flowNames = new Map(items.map((flow) => [flow.id, flow.name]));
  const activeBindings = ((bindingsData ?? []) as BindingRow[]).filter(
    (binding) => binding.status === "active",
  );
  const botBinding = activeBindings.reduce<Map<string, string>>((map, binding) => {
    map.set(binding.telegram_bot_id, binding.flow_id);
    return map;
  }, new Map());
  const botOptions = ((botsData ?? []) as BotRow[]).map((bot) => {
    const connectedFlowId = botBinding.get(bot.id) ?? null;

    return {
      id: bot.id,
      name: bot.bot_name ?? bot.bot_username,
      username: bot.bot_username,
      status: bot.status,
      connectedFlowId,
      connectedFlowName: connectedFlowId
        ? flowNames.get(connectedFlowId) ?? "Fluxo conectado"
        : null,
    };
  });

  return {
    flows: items,
    botOptions,
    linkedFlows: items.filter((flow) => flow.linkedBots > 0).length,
    basicFlows: items.filter((flow) => flow.kind === "basic").length,
    advancedFlows: items.filter((flow) => flow.kind === "advanced").length,
  };
}
