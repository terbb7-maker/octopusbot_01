import { randomUUID } from "crypto";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthenticatedFlowWorkspace } from "@/server/services/flows/flow-context";
import type {
  FlowOrderBumpImage,
  FlowOrderBumps,
} from "@/server/services/flows/types";
import type { Json } from "@/types/database";

const FLOW_MEDIA_BUCKET = "flow-media";

type DraftVersionRow = {
  id: string;
  graph_json: Json;
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

export async function saveFlowOrderBumps(
  flowId: string,
  orderBumps: FlowOrderBumps,
) {
  const { supabase, version, workspaceId } = await getEditableDraftVersion(flowId);

  if (!workspaceId || !version) {
    return { ok: false, message: "Versao draft nao encontrada." };
  }

  const graph = jsonRecord(version.graph_json);
  const nextGraph = {
    ...graph,
    orderBumps,
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
    message: error
      ? "Nao foi possivel salvar os order bumps."
      : "Order bumps salvos.",
  };
}

function extensionFor(file: File) {
  const [, subtype = "jpg"] = file.type.split("/");

  return subtype.replace("jpeg", "jpg");
}

export async function uploadFlowOrderBumpImage({
  bumpId,
  file,
  flowId,
}: {
  bumpId: string;
  file: File;
  flowId: string;
}) {
  const { supabase, workspaceId } = await getEditableDraftVersion(flowId);

  if (!workspaceId) {
    return { ok: false, message: "Versao draft nao encontrada." };
  }

  const path = `${workspaceId}/${flowId}/order-bumps/${bumpId}-${randomUUID()}.${extensionFor(file)}`;
  const { error } = await supabase.storage.from(FLOW_MEDIA_BUCKET).upload(path, file, {
    contentType: file.type,
    upsert: false,
  });

  if (error) return { ok: false, message: "Nao foi possivel enviar a imagem." };

  const image: FlowOrderBumpImage = {
    name: file.name,
    path,
    type: file.type,
  };
  const { data } = await supabase.storage
    .from(FLOW_MEDIA_BUCKET)
    .createSignedUrl(path, 60 * 60);

  return {
    image: {
      ...image,
      signedUrl: data?.signedUrl ?? null,
    },
    message: "Imagem enviada.",
    ok: true,
  };
}
