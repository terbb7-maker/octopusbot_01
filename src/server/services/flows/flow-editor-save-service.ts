import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthenticatedFlowWorkspace } from "@/server/services/flows/flow-context";
import { syncNormalizedPlanData } from "@/server/services/flows/flow-plans-normalized-service";
import type {
  FlowDelivery,
  FlowDownsellSequence,
  FlowEditorMedia,
  FlowInitialConfig,
  FlowInitialConfigMediaValue,
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function mediaItems(media: FlowEditorMedia | undefined) {
  if (!media) return [];

  if (media.type === "video") return media.video ? [media.video] : [];
  if (media.type === "audio") return media.audio ? [media.audio] : [];

  return media.images?.length
    ? media.images
    : media.image
      ? [media.image]
      : [];
}

async function syncNormalizedUpsellData({
  flowId,
  sequences,
  supabase,
  workspaceId,
}: {
  flowId: string;
  sequences: FlowUpsellSequence[];
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>;
  workspaceId: string;
}) {
  const { error: deleteError } = await supabase
    .from("flow_upsell_sequences")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("flow_id", flowId);

  if (deleteError) return { ok: false, message: "Erro ao sincronizar upsells." };
  if (!sequences.length) return { ok: true, message: "Upsells sincronizados." };

  const { data: sequenceRows, error: sequenceError } = await supabase
    .from("flow_upsell_sequences")
    .insert(
      sequences.map((sequence, index) => ({
        ...(isUuid(sequence.id) ? { id: sequence.id } : {}),
        accept_button_color: sequence.button.color ?? "auto",
        accept_button_text: sequence.button.label,
        decline_button_color: sequence.declineButton?.color ?? "auto",
        decline_button_text: sequence.required
          ? null
          : sequence.declineButton?.label ?? "❌ Não quero",
        delay_unit: sequence.delayUnit ?? "minutes",
        delay_value: sequence.delayValue ?? sequence.delayMinutes ?? 0,
        flow_id: flowId,
        media_group: Boolean(sequence.media?.groupImages),
        media_type: sequence.media?.type ?? null,
        message: sequence.message,
        order_bump_mode: sequence.orderBumpMode ?? "none",
        order_index: index,
        required: Boolean(sequence.required),
        sequence_key: sequence.id,
        workspace_id: workspaceId,
      })),
    )
    .select("id,sequence_key");

  if (sequenceError) return { ok: false, message: "Erro ao salvar upsells." };

  const sequenceIds = new Map(
    (sequenceRows ?? []).map((row) => [row.sequence_key, row.id]),
  );
  const planRows = sequences.flatMap((sequence) => {
    const sequenceId = sequenceIds.get(sequence.id);

    if (!sequenceId) return [];

    return sequence.exclusivePlans.map((plan, index) => ({
      flow_id: flowId,
      flow_plan_id: plan.id,
      order_index: index,
      upsell_sequence_id: sequenceId,
      workspace_id: workspaceId,
    }));
  });
  const mediaRows = sequences.flatMap((sequence) => {
    const sequenceId = sequenceIds.get(sequence.id);
    const type = sequence.media?.type ?? "image";

    if (!sequenceId) return [];

    return mediaItems(sequence.media).map(
      (item: FlowInitialConfigMediaValue, index) => ({
        file_name: item.name,
        file_path: item.path,
        file_type: item.type,
        flow_id: flowId,
        grouped: type === "image" && Boolean(sequence.media?.groupImages),
        media_kind: type,
        order_index: item.order ?? index,
        upsell_sequence_id: sequenceId,
        workspace_id: workspaceId,
      }),
    );
  });
  const [planResult, mediaResult] = await Promise.all([
    planRows.length
      ? supabase.from("flow_upsell_sequence_plans").insert(planRows)
      : Promise.resolve({ error: null }),
    mediaRows.length
      ? supabase.from("flow_upsell_sequence_media").insert(mediaRows)
      : Promise.resolve({ error: null }),
  ]);

  if (planResult.error || mediaResult.error) {
    return { ok: false, message: "Erro ao salvar detalhes dos upsells." };
  }

  return { ok: true, message: "Upsells sincronizados." };
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

  const exclusivePlans = input.upsells.flatMap((upsell) =>
    upsell.exclusivePlans.map((plan) => ({ ...plan, active: false })),
  ).concat(
    input.downsells.flatMap((downsell) =>
      downsell.exclusivePlans.map((plan) => ({ ...plan, active: false })),
    ),
  );
  const planResult = await syncNormalizedPlanData({
    defaultDelivery: input.planDefaultDelivery,
    flowId,
    plans: [...input.plans, ...exclusivePlans],
    priceVariation: input.planPriceVariation,
    supabase,
    workspaceId,
  });

  if (!planResult.ok) return planResult;

  const upsellResult = await syncNormalizedUpsellData({
    flowId,
    sequences: input.upsells,
    supabase,
    workspaceId,
  });

  if (!upsellResult.ok) return upsellResult;

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
