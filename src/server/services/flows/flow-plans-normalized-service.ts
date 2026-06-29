import type { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  FlowPlan,
  FlowPlanButtonColor,
  FlowPlanDefaultDelivery,
  FlowPlanPriceVariation,
  FlowPlanStats,
} from "@/server/services/flows/types";
import type { Json } from "@/types/database";

const FLOW_MEDIA_BUCKET = "flow-media";

type Supabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

type FlowPlanRow = {
  id: string;
  flow_id: string;
  workspace_id: string;
  order_index: number;
  name: string;
  price_cents: number;
  billing_type: FlowPlan["billingType"];
  button_color: FlowPlanButtonColor;
  button_text: string;
  image_name: string | null;
  image_path: string | null;
  image_type: string | null;
  delivery_type: FlowPlan["deliveryType"];
  telegram_destination_id: string | null;
  delivery_url: string | null;
  delivery_message: string | null;
  use_default_delivery: boolean;
  use_global_order_bump: boolean;
  order_bump_id: string | null;
  active: boolean;
};

type DefaultDeliveryRow = {
  delivery_type: FlowPlanDefaultDelivery["type"];
  telegram_destination_id: string | null;
  delivery_url: string | null;
  delivery_message: string | null;
};

type PriceVariationRow = {
  enabled: boolean;
  cent_range_start: number;
  cent_range_end: number;
};

type PaymentRow = {
  amount_cents: number;
  flow_plan_id: string | null;
  metadata: Json;
  status: string;
};

export const defaultPlanStats: FlowPlanStats = {
  conversionRate: 0,
  leads: 0,
  pixGenerated: 0,
  pixPaid: 0,
  revenueCents: 0,
};

export const defaultPlanDelivery: FlowPlanDefaultDelivery = {
  type: "custom_message",
  telegramDestinationId: "",
  linkUrl: "",
  message: "",
};

export const defaultPlanPriceVariation: FlowPlanPriceVariation = {
  enabled: false,
  centRangeStart: 1,
  centRangeEnd: 99,
};

function colorHex(color: FlowPlanButtonColor) {
  const colors = {
    default: "#a855f7",
    blue: "#38bdf8",
    green: "#22c55e",
    red: "#ef4444",
  };

  return colors[color];
}

function jsonRecord(value: Json): Record<string, Json> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json>)
    : {};
}

function paymentPlanId(payment: PaymentRow) {
  const metadata = jsonRecord(payment.metadata);
  const metadataPlanId = metadata.plan_id;

  return payment.flow_plan_id ?? (typeof metadataPlanId === "string" ? metadataPlanId : null);
}

function leadKey(payment: PaymentRow) {
  const metadata = jsonRecord(payment.metadata);

  for (const key of ["lead_id", "customer_id", "telegram_chat_id"]) {
    const value = metadata[key];

    if (typeof value === "string" && value) return value;
  }

  return null;
}

function statsByPlan(payments: PaymentRow[]) {
  return payments.reduce<Map<string, FlowPlanStats>>((map, payment) => {
    const planId = paymentPlanId(payment);

    if (!planId) return map;

    const stats = map.get(planId) ?? { ...defaultPlanStats };
    const paid = payment.status === "approved";
    const lead = leadKey(payment);
    const leads = new Set<string>((stats as FlowPlanStats & { leadSet?: Set<string> }).leadSet);

    if (lead) leads.add(lead);

    stats.pixGenerated += 1;
    stats.pixPaid += paid ? 1 : 0;
    stats.revenueCents += paid ? payment.amount_cents : 0;
    stats.leads = leads.size;
    stats.conversionRate = stats.pixGenerated
      ? Math.round((stats.pixPaid / stats.pixGenerated) * 10000) / 100
      : 0;
    (stats as FlowPlanStats & { leadSet?: Set<string> }).leadSet = leads;
    map.set(planId, stats);

    return map;
  }, new Map());
}

async function signPlanImage(supabase: Supabase, plan: FlowPlan) {
  if (!plan.image?.path) return plan;

  const { data } = await supabase.storage
    .from(FLOW_MEDIA_BUCKET)
    .createSignedUrl(plan.image.path, 60 * 60);

  return {
    ...plan,
    image: {
      ...plan.image,
      signedUrl: data?.signedUrl ?? null,
    },
  };
}

function planFromRow(row: FlowPlanRow, stats: FlowPlanStats): FlowPlan {
  return {
    active: row.active,
    billingType: row.billing_type,
    buttonColor: row.button_color,
    buttonLabel: row.button_text,
    buttonValue: "select_plan",
    color: colorHex(row.button_color),
    deliveryConfig: {
      telegramDestinationId: row.telegram_destination_id ?? "",
      linkUrl: row.delivery_url ?? "",
      message: row.delivery_message ?? "",
    },
    deliveryType: row.delivery_type,
    description: "",
    id: row.id,
    image: row.image_path
      ? {
          name: row.image_name ?? "Imagem do plano",
          path: row.image_path,
          type: row.image_type ?? "image/jpeg",
        }
      : null,
    name: row.name,
    order: row.order_index,
    orderBump: { enabled: !row.use_global_order_bump },
    orderBumpId: row.order_bump_id,
    priceCents: row.price_cents,
    stats,
    useDefaultDelivery: row.use_default_delivery,
    useGlobalOrderBump: row.use_global_order_bump,
  };
}

export async function getNormalizedPlanData({
  flowId,
  fallbackPlans,
  supabase,
  workspaceId,
}: {
  flowId: string;
  fallbackPlans: FlowPlan[];
  supabase: Supabase;
  workspaceId: string;
}) {
  const [{ data: plansData }, { data: defaultDeliveryData }, { data: variationData }, { data: paymentsData }] =
    await Promise.all([
      supabase
        .from("flow_plans")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("flow_id", flowId)
        .order("order_index", { ascending: true }),
      supabase
        .from("flow_default_deliveries")
        .select("delivery_type,telegram_destination_id,delivery_url,delivery_message")
        .eq("workspace_id", workspaceId)
        .eq("flow_id", flowId)
        .maybeSingle(),
      supabase
        .from("flow_plan_price_variations")
        .select("enabled,cent_range_start,cent_range_end")
        .eq("workspace_id", workspaceId)
        .eq("flow_id", flowId)
        .maybeSingle(),
      supabase
        .from("payments")
        .select("amount_cents,status,flow_plan_id,metadata")
        .eq("workspace_id", workspaceId)
        .or(`flow_id.eq.${flowId},metadata->>flow_id.eq.${flowId}`),
    ]);
  const stats = statsByPlan((paymentsData ?? []) as PaymentRow[]);
  const rows = (plansData ?? []) as FlowPlanRow[];
  const normalizedPlans = rows.map((row) =>
    planFromRow(row, stats.get(row.id) ?? { ...defaultPlanStats }),
  );
  const plans = normalizedPlans.length
    ? normalizedPlans
    : fallbackPlans.map((plan, index) => ({
        ...plan,
        active: plan.active ?? true,
        billingType: plan.billingType ?? "lifetime",
        buttonColor: plan.buttonColor ?? "default",
        deliveryConfig: plan.deliveryConfig ?? {},
        deliveryType: plan.deliveryType ?? "default",
        order: plan.order ?? index,
        stats: stats.get(plan.id) ?? { ...defaultPlanStats },
        useDefaultDelivery: plan.useDefaultDelivery ?? true,
        useGlobalOrderBump: plan.useGlobalOrderBump ?? true,
      }));
  const defaultDelivery = defaultDeliveryData
    ? {
        type: (defaultDeliveryData as DefaultDeliveryRow).delivery_type,
        telegramDestinationId:
          (defaultDeliveryData as DefaultDeliveryRow).telegram_destination_id ?? "",
        linkUrl: (defaultDeliveryData as DefaultDeliveryRow).delivery_url ?? "",
        message: (defaultDeliveryData as DefaultDeliveryRow).delivery_message ?? "",
      }
    : defaultPlanDelivery;
  const variation = variationData
    ? {
        enabled: (variationData as PriceVariationRow).enabled,
        centRangeStart: (variationData as PriceVariationRow).cent_range_start,
        centRangeEnd: (variationData as PriceVariationRow).cent_range_end,
      }
    : defaultPlanPriceVariation;

  return {
    defaultDelivery,
    plans: await Promise.all(plans.map((plan) => signPlanImage(supabase, plan))),
    priceVariation: variation,
  };
}

export async function syncNormalizedPlanData({
  defaultDelivery,
  flowId,
  plans,
  priceVariation,
  supabase,
  workspaceId,
}: {
  defaultDelivery: FlowPlanDefaultDelivery;
  flowId: string;
  plans: FlowPlan[];
  priceVariation: FlowPlanPriceVariation;
  supabase: Supabase;
  workspaceId: string;
}) {
  const planIds = plans.map((plan) => plan.id);

  if (planIds.length) {
    await supabase
      .from("flow_plans")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("flow_id", flowId)
      .not("id", "in", `(${planIds.join(",")})`);
  } else {
    await supabase
      .from("flow_plans")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("flow_id", flowId);
  }

  if (plans.length) {
    const { error } = await supabase.from("flow_plans").upsert(
      plans.map((plan, index) => ({
        active: plan.active,
        billing_type: plan.billingType,
        button_color: plan.buttonColor,
        button_text: plan.buttonLabel,
        delivery_message: plan.deliveryConfig.message || null,
        delivery_type: plan.deliveryType,
        delivery_url: plan.deliveryConfig.linkUrl || null,
        flow_id: flowId,
        id: plan.id,
        image_name: plan.image?.name ?? null,
        image_path: plan.image?.path ?? null,
        image_type: plan.image?.type ?? null,
        name: plan.name,
        order_bump_id: plan.orderBumpId || null,
        order_index: index,
        price_cents: plan.priceCents,
        telegram_destination_id: plan.deliveryConfig.telegramDestinationId || null,
        use_default_delivery: plan.useDefaultDelivery,
        use_global_order_bump: plan.useGlobalOrderBump,
        workspace_id: workspaceId,
      })),
    );

    if (error) return { ok: false, message: "Erro ao salvar planos." };
  }

  const [deliveryResult, variationResult] = await Promise.all([
    supabase.from("flow_default_deliveries").upsert({
      delivery_message: defaultDelivery.message || null,
      delivery_type: defaultDelivery.type,
      delivery_url: defaultDelivery.linkUrl || null,
      flow_id: flowId,
      telegram_destination_id: defaultDelivery.telegramDestinationId || null,
      workspace_id: workspaceId,
    }, { onConflict: "flow_id" }),
    supabase.from("flow_plan_price_variations").upsert({
      cent_range_end: priceVariation.centRangeEnd,
      cent_range_start: priceVariation.centRangeStart,
      enabled: priceVariation.enabled,
      flow_id: flowId,
      workspace_id: workspaceId,
    }, { onConflict: "flow_id" }),
  ]);

  if (deliveryResult.error || variationResult.error) {
    return { ok: false, message: "Erro ao salvar configuracoes dos planos." };
  }

  return { ok: true, message: "Planos salvos." };
}
