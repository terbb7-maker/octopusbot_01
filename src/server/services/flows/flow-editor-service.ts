import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAuthenticatedFlowWorkspace } from "@/server/services/flows/flow-context";
import { getTelegramDeliveryDestinations } from "@/server/services/flows/flow-deliveries-service";
import {
  defaultPlanStats,
  getNormalizedPlanData,
} from "@/server/services/flows/flow-plans-normalized-service";
import type {
  BasicFlowEditorData,
  FlowDelivery,
  FlowDeliveryFile,
  FlowDownsellSequence,
  FlowInitialConfig,
  FlowInitialConfigMedia,
  FlowInitialConfigMediaValue,
  FlowMessageButton,
  FlowMessageKind,
  FlowMessageMedia,
  FlowMessagesConfig,
  FlowMessageTemplate,
  FlowOrderBumpButton,
  FlowOrderBumpImage,
  FlowOrderBumpIndividual,
  FlowOrderBumpOffer,
  FlowOrderBumps,
  FlowPlan,
  FlowPlanImage,
  FlowPreviewBot,
  FlowUpsellButton,
  FlowUpsellImage,
  FlowUpsellSequence,
} from "@/server/services/flows/types";
import type { Json } from "@/types/database";

const FLOW_MEDIA_BUCKET = "flow-media";
const flowMessageKinds = [
  "pix_generated",
  "payment_approved",
  "pix_expired",
  "error",
  "cancellation",
  "social_proof",
] as const satisfies FlowMessageKind[];
const defaultPlanMessage = "Escolha uma das opções abaixo:";

type FlowEditorRow = {
  id: string;
  name: string;
  status: BasicFlowEditorData["status"];
  updated_at: string;
};

type DraftVersionRow = {
  id: string;
  graph_json: Json;
};

type PreviewBindingRow = {
  telegram_bot_id: string;
};

type PreviewBotRow = {
  bot_name: string | null;
  bot_username: string;
};

function jsonRecord(value: Json | undefined): Record<string, Json> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, Json>)
    : {};
}

function readMediaValue(
  value: Json | undefined,
): FlowInitialConfigMediaValue | null {
  const record = jsonRecord(value);

  if (
    typeof record.name !== "string" ||
    typeof record.path !== "string" ||
    typeof record.type !== "string"
  ) {
    return null;
  }

  return {
    id: typeof record.id === "string" ? record.id : undefined,
    name: record.name,
    path: record.path,
    type: record.type,
    url: typeof record.url === "string" ? record.url : record.path,
    order: typeof record.order === "number" ? record.order : undefined,
  };
}

function readInitialMedia(value: Json | undefined): FlowInitialConfigMedia {
  const media = jsonRecord(value);
  const rawImages = Array.isArray(media.images) ? media.images : [];
  const legacyImage = readMediaValue(media.image);
  const images = rawImages
    .map((item) => readMediaValue(item as Json))
    .filter((item): item is FlowInitialConfigMediaValue => Boolean(item))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .slice(0, 5);
  const type =
    media.type === "image" || media.type === "video" || media.type === "audio"
      ? media.type
      : legacyImage
        ? "image"
        : readMediaValue(media.video)
          ? "video"
          : readMediaValue(media.audio)
            ? "audio"
            : "image";

  return {
    type,
    groupImages:
      typeof media.groupImages === "boolean" ? media.groupImages : false,
    images: images.length ? images : legacyImage ? [legacyImage] : [],
    image: legacyImage ?? undefined,
    video: readMediaValue(media.video),
    audio: readMediaValue(media.audio),
  };
}

function readInitialConfig(graph: Json): FlowInitialConfig {
  const initialConfig = jsonRecord(jsonRecord(graph).initialConfig);
  const cta = jsonRecord(initialConfig.cta);
  const variables = Array.isArray(initialConfig.variables)
    ? initialConfig.variables.filter((item): item is string => typeof item === "string")
    : [];

  return {
    media: readInitialMedia(initialConfig.media),
    message:
      typeof initialConfig.message === "string" ? initialConfig.message : "",
    html: typeof initialConfig.html === "string" ? initialConfig.html : "",
    variables,
    cta: {
      enabled:
        typeof cta.enabled === "boolean"
          ? cta.enabled
          : Boolean(cta.label || cta.value),
      label: typeof cta.label === "string" ? cta.label : "",
      action:
        cta.action === "open_link" || cta.action === "send_message"
          ? cta.action
          : "show_plans",
      url: typeof cta.url === "string" ? cta.url : "",
      message: typeof cta.message === "string" ? cta.message : "",
      value: typeof cta.value === "string" ? cta.value : "",
    },
  };
}

function readPlanMessage(graph: Json | undefined) {
  const value = jsonRecord(graph).planMessage;

  return typeof value === "string" && value.trim()
    ? value
    : defaultPlanMessage;
}

function readPlanImage(value: Json | undefined): FlowPlanImage | null {
  const record = jsonRecord(value);

  if (
    typeof record.name !== "string" ||
    typeof record.path !== "string" ||
    typeof record.type !== "string"
  ) {
    return null;
  }

  return {
    name: record.name,
    path: record.path,
    type: record.type,
  };
}

function readDeliveryFile(value: Json | undefined): FlowDeliveryFile | null {
  const record = jsonRecord(value);

  if (
    typeof record.name !== "string" ||
    typeof record.path !== "string" ||
    typeof record.type !== "string"
  ) {
    return null;
  }

  return {
    name: record.name,
    path: record.path,
    type: record.type,
  };
}

function readOrderBumpImage(value: Json | undefined): FlowOrderBumpImage | null {
  const record = jsonRecord(value);

  if (
    typeof record.name !== "string" ||
    typeof record.path !== "string" ||
    typeof record.type !== "string"
  ) {
    return null;
  }

  return {
    name: record.name,
    path: record.path,
    type: record.type,
  };
}

function readUpsellImage(value: Json | undefined): FlowUpsellImage | null {
  const record = jsonRecord(value);

  if (
    typeof record.name !== "string" ||
    typeof record.path !== "string" ||
    typeof record.type !== "string"
  ) {
    return null;
  }

  return {
    name: record.name,
    path: record.path,
    type: record.type,
  };
}

function readMessageMedia(value: Json | undefined): FlowMessageMedia | null {
  const record = jsonRecord(value);

  if (
    typeof record.id !== "string" ||
    typeof record.name !== "string" ||
    typeof record.path !== "string" ||
    typeof record.type !== "string"
  ) {
    return null;
  }

  return {
    id: record.id,
    name: record.name,
    path: record.path,
    type: record.type,
  };
}

function readOrderBumpButtons(value: Json | undefined): FlowOrderBumpButton[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((button): FlowOrderBumpButton | null => {
      const record = jsonRecord(button as Json);

      if (typeof record.id !== "string") return null;

      return {
        id: record.id,
        label: typeof record.label === "string" ? record.label : "",
        value: typeof record.value === "string" ? record.value : "",
      };
    })
    .filter((button): button is FlowOrderBumpButton => Boolean(button))
    .slice(0, 3);
}

function readMessageButtons(value: Json | undefined): FlowMessageButton[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((button): FlowMessageButton | null => {
      const record = jsonRecord(button as Json);

      if (typeof record.id !== "string") return null;

      return {
        id: record.id,
        label: typeof record.label === "string" ? record.label : "",
        value: typeof record.value === "string" ? record.value : "",
      };
    })
    .filter((button): button is FlowMessageButton => Boolean(button))
    .slice(0, 3);
}

function readUpsellButton(value: Json | undefined): FlowUpsellButton {
  const record = jsonRecord(value);

  return {
    label: typeof record.label === "string" ? record.label : "Ver plano",
    value: typeof record.value === "string" ? record.value : "view_upsell",
    color:
      record.color === "blue" ||
      record.color === "green" ||
      record.color === "red"
        ? record.color
        : "auto",
  };
}

function defaultMessageTemplate(kind: FlowMessageKind): FlowMessageTemplate {
  return {
    kind,
    text: "",
    media: [],
    buttons: [],
    variables: [],
  };
}

function readMessageTemplate(
  kind: FlowMessageKind,
  value: Json | undefined,
): FlowMessageTemplate {
  const record = jsonRecord(value);
  const media = Array.isArray(record.media) ? record.media : [];
  const variables = Array.isArray(record.variables)
    ? record.variables.filter((item): item is string => typeof item === "string")
    : [];

  return {
    kind,
    text: typeof record.text === "string" ? record.text : "",
    media: media
      .map((item) => readMessageMedia(item as Json))
      .filter((item): item is FlowMessageMedia => Boolean(item))
      .slice(0, 5),
    buttons: readMessageButtons(record.buttons),
    variables: variables.slice(0, 20),
  };
}

function readMessages(graph: Json | undefined): FlowMessagesConfig {
  const messages = jsonRecord(jsonRecord(graph).messages);

  return flowMessageKinds.reduce((acc, kind) => {
    acc[kind] = readMessageTemplate(kind, messages[kind]);
    return acc;
  }, {} as FlowMessagesConfig);
}

function readOrderBumpOffer(value: Json | undefined): FlowOrderBumpOffer {
  const record = jsonRecord(value);
  const deliveryType =
    record.deliveryType === "telegram_group" ||
    record.deliveryType === "telegram_channel" ||
    record.deliveryType === "link" ||
    record.deliveryType === "custom_message"
      ? record.deliveryType
      : record.deliveryType === "default"
        ? "default"
        : "default";
  const acceptButtonColor =
    record.acceptButtonColor === "blue" ||
    record.acceptButtonColor === "green" ||
    record.acceptButtonColor === "red"
      ? record.acceptButtonColor
      : "auto";
  const declineButtonColor =
    record.declineButtonColor === "blue" ||
    record.declineButtonColor === "green" ||
    record.declineButtonColor === "red"
      ? record.declineButtonColor
      : "auto";

  return {
    enabled: typeof record.enabled === "boolean" ? record.enabled : false,
    title: typeof record.title === "string" ? record.title : "",
    priceCents:
      typeof record.priceCents === "number" ? record.priceCents : 0,
    message: typeof record.message === "string" ? record.message : "",
    image: readOrderBumpImage(record.image),
    media: record.media ? readInitialMedia(record.media) : undefined,
    acceptButtonText:
      typeof record.acceptButtonText === "string" && record.acceptButtonText.trim()
        ? record.acceptButtonText
        : "✅ Quero aproveitar",
    acceptButtonColor,
    declineButtonText:
      typeof record.declineButtonText === "string" &&
      record.declineButtonText.trim()
        ? record.declineButtonText
        : "❌ Continuar sem bônus",
    declineButtonColor,
    buttons: readOrderBumpButtons(record.buttons),
    deliveryId:
      typeof record.deliveryId === "string" ? record.deliveryId : "",
    deliveryType,
    deliveryConfig: jsonRecord(record.deliveryConfig),
  };
}

function readOfferSequences(
  graph: Json,
  key: "upsells" | "downsells",
  limit: number,
): FlowUpsellSequence[] {
  const sequences = jsonRecord(graph)[key];

  if (!Array.isArray(sequences)) return [];

  return sequences
    .map((sequence): FlowUpsellSequence | null => {
      const record = jsonRecord(sequence as Json);

      if (typeof record.id !== "string") return null;
      const delayMinutes =
        typeof record.delayMinutes === "number"
          ? Math.max(0, record.delayMinutes)
          : 0;
      const delayUnit =
        record.delayUnit === "seconds" || record.delay_unit === "seconds"
          ? "seconds"
          : "minutes";
      const delayValue =
        typeof record.delayValue === "number"
          ? Math.max(0, record.delayValue)
          : delayMinutes;
      const exclusivePlans = Array.isArray(record.exclusivePlans)
        ? record.exclusivePlans
          .map((plan, index): FlowPlan | null => {
            const planRecord = jsonRecord(plan as Json);

            if (typeof planRecord.id !== "string") return null;

            return readPlans({
              plans: [{ ...planRecord, active: false, order: index }],
            } as Json)[0] ?? null;
          })
          .filter((plan): plan is FlowPlan => Boolean(plan))
        : [];
      const button = readUpsellButton(record.button);
      const decline = jsonRecord(record.declineButton);

      return {
        id: record.id,
        delayValue,
        delayUnit,
        delayMinutes: delayUnit === "seconds" ? delayValue / 60 : delayValue,
        message: typeof record.message === "string" ? record.message : "",
        image: readUpsellImage(record.image),
        media: record.media ? readInitialMedia(record.media) : undefined,
        button: {
          ...button,
          color:
            button.color === "blue" ||
            button.color === "green" ||
            button.color === "red"
              ? button.color
              : "auto",
        },
        declineButton: {
          label:
            typeof decline.label === "string" && decline.label.trim()
              ? decline.label
              : "❌ Não quero",
          value: typeof decline.value === "string" ? decline.value : "decline_upsell",
          color:
            decline.color === "blue" ||
            decline.color === "green" ||
            decline.color === "red"
              ? decline.color
              : "auto",
        },
        required:
          typeof record.required === "boolean" ? record.required : false,
        planId: typeof record.planId === "string" ? record.planId : "",
        exclusivePlans,
        orderBumpMode:
          record.orderBumpMode === "exclusive" ||
          record.orderBumpMode === "global"
            ? record.orderBumpMode
            : "none",
        orderBump: record.orderBump ? readOrderBumpOffer(record.orderBump) : null,
      };
    })
    .filter((sequence): sequence is FlowUpsellSequence => Boolean(sequence))
    .slice(0, limit);
}

function readPlans(graph: Json): FlowPlan[] {
  const plans = jsonRecord(graph).plans;

  if (!Array.isArray(plans)) return [];

  return plans
    .map((plan): FlowPlan | null => {
      const record = jsonRecord(plan as Json);
      const orderBump = jsonRecord(record.orderBump);

      if (typeof record.id !== "string" || typeof record.name !== "string") {
        return null;
      }

      return {
        id: record.id,
        name: record.name,
        description:
          typeof record.description === "string" ? record.description : "",
        priceCents:
          typeof record.priceCents === "number" ? record.priceCents : 0,
        order: typeof record.order === "number" ? record.order : 0,
        billingType:
          record.billingType === "monthly" ||
          record.billingType === "quarterly" ||
          record.billingType === "semiannual" ||
          record.billingType === "annual"
            ? record.billingType
            : "lifetime",
        image: readPlanImage(record.image),
        buttonLabel:
          typeof record.buttonLabel === "string"
            ? record.buttonLabel
            : "Selecionar",
        buttonValue:
          typeof record.buttonValue === "string" ? record.buttonValue : "",
        color: typeof record.color === "string" ? record.color : "#a855f7",
        buttonColor:
          record.buttonColor === "blue" ||
          record.buttonColor === "green" ||
          record.buttonColor === "red"
            ? record.buttonColor
            : "default",
        deliveryType:
          record.deliveryType === "telegram_group" ||
          record.deliveryType === "telegram_channel" ||
          record.deliveryType === "link" ||
          record.deliveryType === "custom_message"
            ? record.deliveryType
            : "default",
        deliveryConfig: jsonRecord(record.deliveryConfig),
        useDefaultDelivery:
          typeof record.useDefaultDelivery === "boolean"
            ? record.useDefaultDelivery
            : true,
        useGlobalOrderBump:
          typeof record.useGlobalOrderBump === "boolean"
            ? record.useGlobalOrderBump
            : !orderBump.enabled,
        orderBumpId:
          typeof record.orderBumpId === "string" ? record.orderBumpId : null,
        active: typeof record.active === "boolean" ? record.active : true,
        stats: defaultPlanStats,
        orderBump: {
          enabled:
            typeof orderBump.enabled === "boolean" ? orderBump.enabled : false,
          name: typeof orderBump.name === "string" ? orderBump.name : "",
          description:
            typeof orderBump.description === "string"
              ? orderBump.description
              : "",
          priceCents:
            typeof orderBump.priceCents === "number"
              ? orderBump.priceCents
              : 0,
        },
      };
    })
    .filter((plan): plan is FlowPlan => Boolean(plan))
    .slice(0, 10);
}

function readDeliveries(graph: Json): FlowDelivery[] {
  const deliveries = jsonRecord(graph).deliveries;

  if (!Array.isArray(deliveries)) return [];

  return deliveries
    .map((delivery): FlowDelivery | null => {
      const record = jsonRecord(delivery as Json);

      if (
        typeof record.id !== "string" ||
        typeof record.name !== "string" ||
        typeof record.type !== "string" ||
        ![
          "telegram_group",
          "telegram_channel",
          "link",
          "file",
          "custom_message",
        ].includes(record.type)
      ) {
        return null;
      }

      return {
        id: record.id,
        type: record.type as FlowDelivery["type"],
        name: record.name,
        telegramDestinationId:
          typeof record.telegramDestinationId === "string"
            ? record.telegramDestinationId
            : "",
        linkUrl: typeof record.linkUrl === "string" ? record.linkUrl : "",
        file: readDeliveryFile(record.file),
        message: typeof record.message === "string" ? record.message : "",
      };
    })
    .filter((delivery): delivery is FlowDelivery => Boolean(delivery))
    .slice(0, 20);
}

function readOrderBumps(graph: Json): FlowOrderBumps {
  const orderBumps = jsonRecord(graph).orderBumps;
  const record = jsonRecord(orderBumps);
  const individual = Array.isArray(record.individual) ? record.individual : [];

  return {
    global: readOrderBumpOffer(record.global),
    individual: individual
      .map((item): FlowOrderBumpIndividual | null => {
        const itemRecord = jsonRecord(item as Json);

        if (
          typeof itemRecord.id !== "string" ||
          typeof itemRecord.planId !== "string"
        ) {
          return null;
        }

        return {
          ...readOrderBumpOffer(item as Json),
          id: itemRecord.id,
          planId: itemRecord.planId,
        };
      })
      .filter((item): item is FlowOrderBumpIndividual => Boolean(item))
      .slice(0, 10),
  };
}

async function withSignedMediaUrls(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  config: FlowInitialConfig,
) {
  const media = { ...(config.media ?? {}) };
  const signItem = async (item: FlowInitialConfigMediaValue | null | undefined) => {
    if (!item?.path) return item ?? null;

    const { data } = await supabase.storage
      .from(FLOW_MEDIA_BUCKET)
      .createSignedUrl(item.path, 60 * 60);

    return { ...item, signedUrl: data?.signedUrl ?? null };
  };
  const [image, video, audio, images] = await Promise.all([
    signItem(media.image),
    signItem(media.video),
    signItem(media.audio),
    Promise.all((media.images ?? []).map((item) => signItem(item))),
  ]);

  media.image = image ?? undefined;
  media.video = video;
  media.audio = audio;
  media.images = images.filter(
    (item): item is FlowInitialConfigMediaValue => Boolean(item),
  );

  return { ...config, media };
}

async function withSignedPlanImages(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  plans: FlowPlan[],
) {
  return Promise.all(
    plans.map(async (plan) => {
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
    }),
  );
}

async function withSignedDeliveryFiles(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  deliveries: FlowDelivery[],
) {
  return Promise.all(
    deliveries.map(async (delivery) => {
      if (!delivery.file?.path) return delivery;

      const { data } = await supabase.storage
        .from(FLOW_MEDIA_BUCKET)
        .createSignedUrl(delivery.file.path, 60 * 60);

      return {
        ...delivery,
        file: {
          ...delivery.file,
          signedUrl: data?.signedUrl ?? null,
        },
      };
    }),
  );
}

async function withSignedMessageMedia(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  messages: FlowMessagesConfig,
) {
  const entries = await Promise.all(
    flowMessageKinds.map(async (kind) => {
      const template = messages[kind] ?? defaultMessageTemplate(kind);
      const media = await Promise.all(
        template.media.map(async (item) => {
          if (!item.path) return item;

          const { data } = await supabase.storage
            .from(FLOW_MEDIA_BUCKET)
            .createSignedUrl(item.path, 60 * 60);

          return {
            ...item,
            signedUrl: data?.signedUrl ?? null,
          };
        }),
      );

      return [kind, { ...template, media }] as const;
    }),
  );

  return Object.fromEntries(entries) as FlowMessagesConfig;
}

async function signOrderBumpOfferImage(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  offer: FlowOrderBumpOffer,
) {
  const mediaConfig = await withSignedMediaUrls(supabase, {
    media: offer.media,
  });

  if (!offer.image?.path) {
    return { ...offer, media: mediaConfig.media };
  }

  const { data } = await supabase.storage
    .from(FLOW_MEDIA_BUCKET)
    .createSignedUrl(offer.image.path, 60 * 60);

  return {
    ...offer,
    media: mediaConfig.media,
    image: {
      ...offer.image,
      signedUrl: data?.signedUrl ?? null,
    },
  };
}

async function withSignedOrderBumpImages(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  orderBumps: FlowOrderBumps,
) {
  const [global, individual] = await Promise.all([
    signOrderBumpOfferImage(supabase, orderBumps.global),
    Promise.all(
      orderBumps.individual.map((item) =>
        signOrderBumpOfferImage(supabase, item),
      ),
    ),
  ]);

  return {
    global,
    individual: individual.map((item, index) => ({
      ...item,
      id: orderBumps.individual[index]?.id ?? "",
      planId: orderBumps.individual[index]?.planId ?? "",
    })),
  };
}

async function withSignedOfferSequenceImages<T extends FlowUpsellSequence>(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  sequences: T[],
) {
  return Promise.all(
    sequences.map(async (sequence) => {
      const mediaConfig = await withSignedMediaUrls(supabase, {
        media: sequence.media,
      });
      const exclusivePlans = await withSignedPlanImages(
        supabase,
        sequence.exclusivePlans ?? [],
      );
      const orderBump = sequence.orderBump
        ? await signOrderBumpOfferImage(supabase, sequence.orderBump)
        : sequence.orderBump;

      if (!sequence.image?.path) {
        return {
          ...sequence,
          exclusivePlans,
          media: mediaConfig.media,
          orderBump,
        };
      }

      const { data } = await supabase.storage
        .from(FLOW_MEDIA_BUCKET)
        .createSignedUrl(sequence.image.path, 60 * 60);

      return {
        ...sequence,
        exclusivePlans,
        media: mediaConfig.media,
        orderBump,
        image: {
          ...sequence.image,
          signedUrl: data?.signedUrl ?? null,
        },
      };
    }),
  );
}

async function getPreviewBot(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  flowId: string,
  workspaceId: string,
): Promise<FlowPreviewBot | null> {
  const { data: bindingData } = await supabase
    .from("flow_bot_bindings")
    .select("telegram_bot_id")
    .eq("flow_id", flowId)
    .eq("workspace_id", workspaceId)
    .eq("status", "active")
    .is("deleted_at", null)
    .limit(1)
    .maybeSingle();
  const binding = bindingData as PreviewBindingRow | null;

  if (!binding) return null;

  const { data: botData } = await supabase
    .from("telegram_bots")
    .select("bot_name,bot_username")
    .eq("id", binding.telegram_bot_id)
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .maybeSingle();
  const bot = botData as PreviewBotRow | null;

  if (!bot) return null;

  return {
    name: bot.bot_name ?? bot.bot_username,
    username: bot.bot_username,
  };
}

export async function getBasicFlowEditorData(
  flowId: string,
): Promise<BasicFlowEditorData | null> {
  const supabase = await createSupabaseServerClient();
  const { workspaceId } = await getAuthenticatedFlowWorkspace(supabase);

  if (!workspaceId) return null;

  const { data } = await supabase
    .from("flows")
    .select("id,name,status,updated_at")
    .eq("id", flowId)
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .maybeSingle();

  if (!data) return null;

  const flow = data as FlowEditorRow;
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
  const initialConfig = version
    ? await withSignedMediaUrls(supabase, readInitialConfig(version.graph_json))
    : {};
  const graphPlans = version
    ? await withSignedPlanImages(supabase, readPlans(version.graph_json))
    : [];
  const planData = await getNormalizedPlanData({
    fallbackPlans: graphPlans,
    flowId,
    supabase,
    workspaceId,
  });
  const deliveries = version
    ? await withSignedDeliveryFiles(supabase, readDeliveries(version.graph_json))
    : [];
  const messages = version
    ? await withSignedMessageMedia(supabase, readMessages(version.graph_json))
    : readMessages(undefined);
  const orderBumps = version
    ? await withSignedOrderBumpImages(supabase, readOrderBumps(version.graph_json))
    : {
        global: readOrderBumpOffer(undefined),
        individual: [],
      };
  const upsells = version
    ? await withSignedOfferSequenceImages(
        supabase,
        readOfferSequences(version.graph_json, "upsells", 5),
      )
    : [];
  const downsells: FlowDownsellSequence[] = version
    ? await withSignedOfferSequenceImages(
        supabase,
        readOfferSequences(version.graph_json, "downsells", 20),
      )
    : [];
  const telegramDeliveryDestinations = await getTelegramDeliveryDestinations();
  const previewBot = await getPreviewBot(supabase, flowId, workspaceId);

  return {
    id: flow.id,
    name: flow.name,
    status: flow.status,
    updatedAt: flow.updated_at,
    draftVersionId: version?.id ?? null,
    initialConfig,
    planMessage: readPlanMessage(version?.graph_json),
    plans: planData.plans.filter((plan) => plan.active !== false),
    planDefaultDelivery: planData.defaultDelivery,
    planPriceVariation: planData.priceVariation,
    deliveries,
    messages,
    orderBumps,
    upsells,
    downsells,
    telegramDeliveryDestinations,
    previewBot,
  };
}
