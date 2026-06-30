import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthenticatedFlowWorkspace } from "@/server/services/flows/flow-context";
import { syncNormalizedPlanData } from "@/server/services/flows/flow-plans-normalized-service";
import type {
  FlowDelivery,
  FlowDownsellSequence,
  FlowInitialConfig,
  FlowMessagesConfig,
  FlowOrderBumps,
  FlowPlan,
  FlowPlanDefaultDelivery,
  FlowPlanPriceVariation,
  FlowUpsellSequence,
} from "@/server/services/flows/types";
import type { Json } from "@/types/database";

type DraftVersionRow = {
  id: string;
  graph_json: Json;
};

export type SaveBasicFlowEditorInput = {
  initialConfig: FlowInitialConfig;
  planMessage: string;
  plans: FlowPlan[];
  planDefaultDelivery: FlowPlanDefaultDelivery;
  planPriceVariation: FlowPlanPriceVariation;
  deliveries: FlowDelivery[];
  messages: FlowMessagesConfig;
  orderBumps: FlowOrderBumps;
  upsells: FlowUpsellSequence[];
  downsells: FlowDownsellSequence[];
};

function jsonRecord(value: Json): Record<string, Json> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json>)
    : {};
}

function toJson(value: unknown): Json {
  return value as Json;
}

export async function saveBasicFlowEditorData(
  flowId: string,
  input: SaveBasicFlowEditorInput,
) {
  const supabase = await createSupabaseServerClient();
  const { workspaceId } = await getAuthenticatedFlowWorkspace(supabase);

  if (!workspaceId) {
    return { ok: false, message: "Workspace nao encontrado." };
  }

  const { data: versionData } = await supabase
    .from("flow_versions")
    .select("id,graph_json")
    .eq("flow_id", flowId)
    .eq("workspace_id", workspaceId)
    .eq("status", "draft")
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const version = (versionData ?? null) as DraftVersionRow | null;

  if (!version) {
    return { ok: false, message: "Versao draft nao encontrada." };
  }

  const planResult = await syncNormalizedPlanData({
    defaultDelivery: input.planDefaultDelivery,
    flowId,
    plans: input.plans,
    priceVariation: input.planPriceVariation,
    supabase,
    workspaceId,
  });

  if (!planResult.ok) return planResult;

  const now = new Date().toISOString();
  const cta = input.initialConfig.cta;
  const globalOrderBump = input.orderBumps.global;
  const nextGraph = {
    ...jsonRecord(version.graph_json),
    ...input,
    updatedAt: now,
  };

  const { error } = await supabase
    .from("flow_versions")
    .update({
      graph_json: toJson(nextGraph),
      compiled_graph_json: toJson(nextGraph),
      cta_enabled: Boolean(cta?.enabled),
      cta_label: cta?.enabled ? cta.label || null : null,
      cta_action: cta?.action ?? "show_plans",
      cta_url: cta?.enabled && cta.action === "open_link" ? cta.url || null : null,
      cta_message:
        cta?.enabled && cta.action === "send_message" ? cta.message || null : null,
      order_bump_accept_button_text:
        globalOrderBump.acceptButtonText || "✅ Quero aproveitar",
      order_bump_accept_button_color: globalOrderBump.acceptButtonColor || "auto",
      order_bump_decline_button_text:
        globalOrderBump.declineButtonText || "❌ Continuar sem bônus",
      order_bump_decline_button_color: globalOrderBump.declineButtonColor || "auto",
      order_bump_media_type: globalOrderBump.media?.type ?? null,
      order_bump_media_group: Boolean(globalOrderBump.media?.groupImages),
      order_bump_delivery_type: globalOrderBump.deliveryType ?? "default",
      order_bump_delivery_chat_id:
        globalOrderBump.deliveryConfig.telegramChatId ?? null,
      order_bump_delivery_url:
        globalOrderBump.deliveryType === "link"
          ? globalOrderBump.deliveryConfig.linkUrl || null
          : null,
      order_bump_delivery_message:
        globalOrderBump.deliveryType === "custom_message"
          ? globalOrderBump.deliveryConfig.message || null
          : null,
      validation_status: "pending",
    })
    .eq("id", version.id)
    .eq("workspace_id", workspaceId);

  if (error) {
    return { ok: false, message: "Erro ao salvar fluxo." };
  }

  return { ok: true, message: "Fluxo salvo com sucesso." };
}
