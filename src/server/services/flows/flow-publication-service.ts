import { createHash } from "crypto";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthenticatedFlowWorkspace } from "@/server/services/flows/flow-context";
import type {
  FlowActionResult,
  FlowPlanDeliveryType,
} from "@/server/services/flows/types";
import type { Json } from "@/types/database";

type DraftVersion = {
  compiled_graph_json: Json;
  cta_action: "show_plans" | "open_link" | "send_message";
  cta_enabled: boolean;
  cta_label: string | null;
  cta_message: string | null;
  cta_url: string | null;
  flow_id: string;
  graph_json: Json;
  id: string;
  order_bump_accept_button_color: "auto" | "blue" | "green" | "red";
  order_bump_accept_button_text: string | null;
  order_bump_decline_button_color: "auto" | "blue" | "green" | "red";
  order_bump_decline_button_text: string | null;
  order_bump_delivery_chat_id: number | null;
  order_bump_delivery_message: string | null;
  order_bump_delivery_type: FlowPlanDeliveryType | null;
  order_bump_delivery_url: string | null;
  order_bump_media_group: boolean;
  order_bump_media_type: "image" | "video" | "audio" | null;
  version_number: number;
  workspace_id: string;
};

function result(ok: boolean, message: string): FlowActionResult {
  return { ok, message };
}

function checksum(value: Json) {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

export async function publishFlow(flowId: string): Promise<FlowActionResult> {
  const supabase = await createSupabaseServerClient();
  const { userId, workspaceId } = await getAuthenticatedFlowWorkspace(supabase);

  if (!workspaceId) return result(false, "Workspace nao encontrado.");

  const { data: draftData } = await supabase
    .from("flow_versions")
    .select("*")
    .eq("flow_id", flowId)
    .eq("workspace_id", workspaceId)
    .eq("status", "draft")
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();
  const draft = (draftData ?? null) as DraftVersion | null;

  if (!draft) return result(false, "Versao draft nao encontrada.");

  const { data: latestVersions } = await supabase
    .from("flow_versions")
    .select("version_number")
    .eq("flow_id", flowId)
    .eq("workspace_id", workspaceId)
    .order("version_number", { ascending: false })
    .limit(1);
  const nextVersionNumber = (latestVersions?.[0]?.version_number ?? 0) + 1;
  const publishedAt = new Date().toISOString();

  const { data: published, error: publishError } = await supabase
    .from("flow_versions")
    .insert({
      checksum: checksum(draft.compiled_graph_json),
      compiled_graph_json: draft.compiled_graph_json,
      cta_action: draft.cta_action,
      cta_enabled: draft.cta_enabled,
      cta_label: draft.cta_label,
      cta_message: draft.cta_message,
      cta_url: draft.cta_url,
      flow_id: flowId,
      graph_json: draft.graph_json,
      graph_schema_version: 1,
      order_bump_accept_button_color: draft.order_bump_accept_button_color,
      order_bump_accept_button_text: draft.order_bump_accept_button_text,
      order_bump_decline_button_color: draft.order_bump_decline_button_color,
      order_bump_decline_button_text: draft.order_bump_decline_button_text,
      order_bump_delivery_chat_id: draft.order_bump_delivery_chat_id,
      order_bump_delivery_message: draft.order_bump_delivery_message,
      order_bump_delivery_type: draft.order_bump_delivery_type,
      order_bump_delivery_url: draft.order_bump_delivery_url,
      order_bump_media_group: draft.order_bump_media_group,
      order_bump_media_type: draft.order_bump_media_type,
      published_at: publishedAt,
      published_by: userId,
      status: "published",
      validation_errors: [],
      validation_status: "valid",
      version_number: nextVersionNumber,
      workspace_id: workspaceId,
    })
    .select("id")
    .single();

  if (publishError || !published) {
    return result(false, "Nao foi possivel publicar o fluxo.");
  }

  const { error: flowError } = await supabase
    .from("flows")
    .update({
      active_version_id: published.id,
      status: "active",
      updated_by: userId,
    })
    .eq("id", flowId)
    .eq("workspace_id", workspaceId);

  if (flowError) return result(false, "Fluxo publicado sem ativacao.");

  const { data: bindings } = await supabase
    .from("flow_bot_bindings")
    .select("id")
    .eq("flow_id", flowId)
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .is("deleted_at", null);

  for (const binding of bindings ?? []) {
    await supabase
      .from("flow_deployments")
      .update({ retired_at: publishedAt, status: "retired" })
      .eq("binding_id", binding.id)
      .eq("workspace_id", workspaceId)
      .eq("status", "active");

    const { data: deployment, error } = await supabase
      .from("flow_deployments")
      .insert({
        binding_id: binding.id,
        created_by: userId,
        flow_id: flowId,
        metadata: { publishedVersionId: published.id },
        status: "paused",
        strategy: "single",
        workspace_id: workspaceId,
      })
      .select("id")
      .single();

    if (error || !deployment) continue;

    await supabase.from("flow_deployment_variants").insert({
      deployment_id: deployment.id,
      flow_id: flowId,
      flow_version_id: published.id,
      is_control: true,
      name: "control",
      weight_basis_points: 10000,
      workspace_id: workspaceId,
    });

    await supabase
      .from("flow_deployments")
      .update({ activated_at: publishedAt, status: "active" })
      .eq("id", deployment.id)
      .eq("workspace_id", workspaceId);
  }

  return result(true, "Fluxo publicado com sucesso.");
}
