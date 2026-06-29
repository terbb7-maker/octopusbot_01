import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthenticatedFlowWorkspace } from "@/server/services/flows/flow-context";
import type {
  CreateFlowInput,
  FlowActionResult,
} from "@/server/services/flows/types";

function actionResult(
  ok: boolean,
  message: string,
  flowId?: string,
): FlowActionResult {
  return { ok, message, flowId };
}

export async function createFlow(input: CreateFlowInput): Promise<FlowActionResult> {
  const supabase = await createSupabaseServerClient();
  const { userId, workspaceId } = await getAuthenticatedFlowWorkspace(supabase);

  if (!workspaceId) return actionResult(false, "Workspace nao encontrado.");

  const { data: flow, error } = await supabase
    .from("flows")
    .insert({
      workspace_id: workspaceId,
      name: input.name,
      description: "Fluxo basico criado a partir da tela Meus Fluxos.",
      status: "draft",
      created_by: userId,
      updated_by: userId,
    })
    .select("id")
    .single();

  if (error || !flow) return actionResult(false, "Nao foi possivel criar o fluxo.");

  const graph = {
    mode: input.mode,
    nodes: [],
    edges: [],
  };

  const { error: versionError } = await supabase.from("flow_versions").insert({
    workspace_id: workspaceId,
    flow_id: flow.id,
    version_number: 1,
    status: "draft",
    graph_schema_version: 1,
    graph_json: graph,
    compiled_graph_json: graph,
    validation_status: "pending",
    validation_errors: [],
    created_by: userId,
  });

  if (versionError) return actionResult(false, "Fluxo criado sem versao inicial.");

  return actionResult(true, "Fluxo criado com sucesso.", flow.id);
}

export async function duplicateFlow(flowId: string): Promise<FlowActionResult> {
  const supabase = await createSupabaseServerClient();
  const { userId, workspaceId } = await getAuthenticatedFlowWorkspace(supabase);

  if (!workspaceId) return actionResult(false, "Workspace nao encontrado.");

  const { data: flow } = await supabase
    .from("flows")
    .select("name,description")
    .eq("id", flowId)
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!flow) return actionResult(false, "Fluxo nao encontrado.");

  const { error } = await supabase.from("flows").insert({
    workspace_id: workspaceId,
    name: `Copia de ${flow.name}`,
    description: flow.description,
    status: "draft",
    created_by: userId,
    updated_by: userId,
  });

  if (error) return actionResult(false, "Nao foi possivel duplicar o fluxo.");

  return actionResult(true, "Fluxo duplicado com sucesso.");
}

export async function archiveFlow(flowId: string): Promise<FlowActionResult> {
  const supabase = await createSupabaseServerClient();
  const { userId, workspaceId } = await getAuthenticatedFlowWorkspace(supabase);

  if (!workspaceId) return actionResult(false, "Workspace nao encontrado.");

  const { error } = await supabase
    .from("flows")
    .update({
      status: "archived",
      deleted_at: new Date().toISOString(),
      updated_by: userId,
    })
    .eq("id", flowId)
    .eq("workspace_id", workspaceId);

  if (error) return actionResult(false, "Nao foi possivel excluir o fluxo.");

  return actionResult(true, "Fluxo excluido com sucesso.");
}
