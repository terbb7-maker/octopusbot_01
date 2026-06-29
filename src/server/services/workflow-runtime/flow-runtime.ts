import { decryptSecret } from "@/lib/security/encryption";
import { getTelegramBotTokenEnv } from "@/lib/security/env";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type {
  FlowDelivery,
  FlowDownsellSequence,
  FlowInitialConfig,
  FlowMessagesConfig,
  FlowOrderBumps,
  FlowPlan,
  FlowPlanDefaultDelivery,
  FlowUpsellSequence,
} from "@/server/services/flows";
import type {
  RuntimeConfig,
  RuntimeGraph,
} from "@/server/services/workflow-runtime/types";
import { jsonRecord } from "@/server/services/workflow-runtime/types";
import type { Json } from "@/types/database";

const runtimeCache = new Map<string, { config: RuntimeConfig; signature: string }>();

type VersionRow = {
  compiled_graph_json: Json;
  id: string;
  updated_at: string;
};

function graphFromJson(value: Json): RuntimeGraph {
  const graph = jsonRecord(value);

  return {
    deliveries: Array.isArray(graph.deliveries)
      ? (graph.deliveries as FlowDelivery[])
      : [],
    downsells: Array.isArray(graph.downsells)
      ? (graph.downsells as FlowDownsellSequence[])
      : [],
    initialConfig: jsonRecord(graph.initialConfig) as FlowInitialConfig,
    messages: jsonRecord(graph.messages) as FlowMessagesConfig,
    orderBumps: jsonRecord(graph.orderBumps) as FlowOrderBumps,
    planDefaultDelivery: jsonRecord(graph.planDefaultDelivery) as FlowPlanDefaultDelivery,
    planMessage:
      typeof graph.planMessage === "string" && graph.planMessage.trim()
        ? graph.planMessage
        : "Escolha uma das opções abaixo:",
    plans: Array.isArray(graph.plans) ? (graph.plans as FlowPlan[]) : [],
    upsells: Array.isArray(graph.upsells)
      ? (graph.upsells as FlowUpsellSequence[])
      : [],
  };
}

function signatureKey(parts: string[]) {
  return parts.filter(Boolean).join(":");
}

export class FlowRuntime {
  async loadPublishedConfig(botId: string, workspaceId: string) {
    const admin = getSupabaseServiceRoleClient();
    const { data: bot } = await admin
      .from("telegram_bots")
      .select("id,workspace_id,bot_name,bot_username,bot_token_encrypted,updated_at")
      .eq("id", botId)
      .eq("workspace_id", workspaceId)
      .eq("status", "active")
      .is("deleted_at", null)
      .maybeSingle();

    if (!bot) return null;

    const { data: binding } = await admin
      .from("flow_bot_bindings")
      .select("id,flow_id,updated_at")
      .eq("workspace_id", workspaceId)
      .eq("telegram_bot_id", botId)
      .eq("status", "active")
      .is("deleted_at", null)
      .maybeSingle();

    if (!binding) return null;

    const { data: deployment } = await admin
      .from("flow_deployments")
      .select("id,flow_id,updated_at")
      .eq("workspace_id", workspaceId)
      .eq("binding_id", binding.id)
      .eq("flow_id", binding.flow_id)
      .eq("status", "active")
      .order("activated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!deployment) return null;

    const { data: variant } = await admin
      .from("flow_deployment_variants")
      .select("id,flow_version_id")
      .eq("workspace_id", workspaceId)
      .eq("deployment_id", deployment.id)
      .eq("is_control", true)
      .maybeSingle();

    if (!variant) return null;

    const { data: versionData } = await admin
      .from("flow_versions")
      .select("id,compiled_graph_json,updated_at")
      .eq("workspace_id", workspaceId)
      .eq("flow_id", binding.flow_id)
      .eq("id", variant.flow_version_id)
      .eq("status", "published")
      .maybeSingle();
    const version = (versionData ?? null) as VersionRow | null;

    if (!version) return null;

    const signature = signatureKey([
      binding.id,
      binding.updated_at,
      deployment.id,
      deployment.updated_at,
      variant.id,
      version.id,
      version.updated_at,
      bot.updated_at,
    ]);
    const cacheKey = `${workspaceId}:${botId}:${deployment.id}`;
    const cached = runtimeCache.get(cacheKey);

    if (cached?.signature === signature) return cached.config;

    const tokenSecret = getTelegramBotTokenEnv().telegramBotTokenEncryptionKey;
    const config: RuntimeConfig = {
      bindingId: binding.id,
      bot: {
        id: bot.id,
        name: bot.bot_name ?? bot.bot_username,
        token: decryptSecret(bot.bot_token_encrypted, tokenSecret),
        username: bot.bot_username,
        workspaceId,
      },
      deploymentId: deployment.id,
      flowId: binding.flow_id,
      graph: graphFromJson(version.compiled_graph_json),
      signature,
      variantId: variant.id,
      versionId: version.id,
      workspaceId,
    };

    runtimeCache.set(cacheKey, { config, signature });

    return config;
  }

  async loadSessionConfig(session: {
    deployment_id: string;
    flow_id: string;
    flow_version_id: string;
    telegram_bot_id: string;
    variant_id: string;
    workspace_id: string;
  }) {
    const admin = getSupabaseServiceRoleClient();
    const { data: bot } = await admin
      .from("telegram_bots")
      .select("id,workspace_id,bot_name,bot_username,bot_token_encrypted,updated_at")
      .eq("id", session.telegram_bot_id)
      .eq("workspace_id", session.workspace_id)
      .eq("status", "active")
      .is("deleted_at", null)
      .maybeSingle();

    if (!bot) return null;

    const { data: deployment } = await admin
      .from("flow_deployments")
      .select("id,binding_id,updated_at")
      .eq("id", session.deployment_id)
      .eq("workspace_id", session.workspace_id)
      .eq("flow_id", session.flow_id)
      .maybeSingle();

    if (!deployment) return null;

    const { data: versionData } = await admin
      .from("flow_versions")
      .select("id,compiled_graph_json,updated_at")
      .eq("id", session.flow_version_id)
      .eq("workspace_id", session.workspace_id)
      .eq("flow_id", session.flow_id)
      .eq("status", "published")
      .maybeSingle();
    const version = (versionData ?? null) as VersionRow | null;

    if (!version) return null;

    const signature = signatureKey([
      deployment.id,
      deployment.updated_at,
      session.variant_id,
      version.id,
      version.updated_at,
      bot.updated_at,
    ]);
    const cacheKey = `${session.workspace_id}:${bot.id}:${deployment.id}:${version.id}`;
    const cached = runtimeCache.get(cacheKey);

    if (cached?.signature === signature) return cached.config;

    const tokenSecret = getTelegramBotTokenEnv().telegramBotTokenEncryptionKey;
    const config: RuntimeConfig = {
      bindingId: deployment.binding_id,
      bot: {
        id: bot.id,
        name: bot.bot_name ?? bot.bot_username,
        token: decryptSecret(bot.bot_token_encrypted, tokenSecret),
        username: bot.bot_username,
        workspaceId: session.workspace_id,
      },
      deploymentId: deployment.id,
      flowId: session.flow_id,
      graph: graphFromJson(version.compiled_graph_json),
      signature,
      variantId: session.variant_id,
      versionId: version.id,
      workspaceId: session.workspace_id,
    };

    runtimeCache.set(cacheKey, { config, signature });

    return config;
  }
}
