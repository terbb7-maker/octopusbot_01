"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  archiveFlow,
  createFlow,
  duplicateFlow,
  publishFlow,
  saveBasicFlowEditorData,
  saveFlowDeliveries,
  saveFlowDownsells,
  saveInitialConfig,
  saveFlowMessages,
  saveFlowOrderBumps,
  saveFlowPlans,
  saveFlowUpsells,
  type FlowActionResult,
  updateFlowBotBindings,
  uploadFlowDeliveryFile,
  uploadFlowDownsellImage,
  uploadInitialConfigMedia,
  uploadFlowMessageMedia,
  uploadFlowOrderBumpImage,
  uploadFlowPlanImage,
  uploadFlowUpsellImage,
} from "@/server/services/flows";

const flowIdSchema = z.string().uuid("Fluxo invalido.");
const botIdsSchema = z.array(z.string().uuid("Bot invalido.")).max(50);
const flowMessageKindSchema = z.enum([
  "pix_generated",
  "payment_approved",
  "pix_expired",
  "error",
  "cancellation",
  "social_proof",
]);
const mediaSchema = z
  .object({
    id: z.string().max(80).optional(),
    name: z.string().max(160),
    path: z.string().max(500),
    type: z.string().max(120),
    url: z.string().max(500).optional(),
    order: z.number().int().min(0).max(50).optional(),
  })
  .optional();
const requiredMediaSchema = z.object({
  id: z.string().max(80).optional(),
  name: z.string().max(160),
  path: z.string().max(500),
  type: z.string().max(120),
  url: z.string().max(500).optional(),
  order: z.number().int().min(0).max(50).optional(),
});
const initialConfigSchema = z.object({
  media: z.object({
    type: z.enum(["image", "video", "audio"]).optional(),
    groupImages: z.boolean().optional(),
    images: z.array(requiredMediaSchema).max(5).optional(),
    image: mediaSchema,
    video: requiredMediaSchema.nullable().optional(),
    audio: requiredMediaSchema.nullable().optional(),
  }).optional(),
  message: z.string().max(4000).optional(),
  html: z.string().max(12000).optional(),
  variables: z.array(z.string().trim().min(1).max(32)).max(20).optional(),
  cta: z
    .object({
      enabled: z.boolean().default(false),
      label: z.string().max(40).default(""),
      action: z.enum(["show_plans", "open_link", "send_message"]).default("show_plans"),
      url: z.string().max(500).optional(),
      message: z.string().max(1600).optional(),
      value: z.string().max(240).optional(),
    })
    .optional(),
});
const planImageSchema = z
  .object({
    name: z.string().max(160),
    path: z.string().max(500),
    type: z.string().max(120),
  })
  .nullable()
  .optional();
const flowPlanSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().trim().min(1).max(40),
  description: z.string().max(240).optional(),
  order: z.number().int().min(0).max(10),
  priceCents: z.number().int().min(0).max(99999900),
  billingType: z.enum(["lifetime", "monthly", "quarterly", "semiannual", "annual"]),
  image: planImageSchema,
  buttonLabel: z.string().trim().min(1).max(40),
  buttonValue: z.string().max(120).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  buttonColor: z.enum(["default", "blue", "green", "red"]),
  deliveryType: z.enum([
    "default",
    "telegram_group",
    "telegram_channel",
    "link",
    "custom_message",
  ]),
  deliveryConfig: z.object({
    telegramDestinationId: z.string().max(200).optional(),
    linkUrl: z.string().max(500).optional(),
    message: z.string().max(1600).optional(),
  }),
  useDefaultDelivery: z.boolean(),
  useGlobalOrderBump: z.boolean(),
  orderBumpId: z.string().uuid().nullable().optional(),
  active: z.boolean(),
  stats: z.object({
    leads: z.number().int().min(0),
    pixGenerated: z.number().int().min(0),
    pixPaid: z.number().int().min(0),
    conversionRate: z.number().min(0),
    revenueCents: z.number().int().min(0),
  }),
  orderBump: z.object({
    enabled: z.boolean(),
    name: z.string().max(60).optional(),
    description: z.string().max(200).optional(),
    priceCents: z.number().int().min(0).max(99999900).optional(),
  }),
});
const plansSchema = z.array(flowPlanSchema).max(10);
const planDefaultDeliverySchema = z.object({
  type: z.enum(["telegram_group", "telegram_channel", "link", "custom_message"]),
  telegramDestinationId: z.string().max(200).optional(),
  linkUrl: z.string().max(500).optional(),
  message: z.string().max(1600).optional(),
});
const planPriceVariationSchema = z.object({
  enabled: z.boolean(),
  centRangeStart: z.number().int().min(0).max(99),
  centRangeEnd: z.number().int().min(0).max(99),
});
const deliveryFileSchema = z
  .object({
    name: z.string().max(160),
    path: z.string().max(500),
    type: z.string().max(120),
  })
  .nullable()
  .optional();
const flowDeliverySchema = z.object({
  id: z.string().min(1).max(80),
  type: z.enum([
    "telegram_group",
    "telegram_channel",
    "link",
    "file",
    "custom_message",
  ]),
  name: z.string().trim().min(1).max(80),
  telegramDestinationId: z.string().max(160).optional(),
  linkUrl: z.string().max(500).optional(),
  file: deliveryFileSchema,
  message: z.string().max(1200).optional(),
});
const deliveriesSchema = z.array(flowDeliverySchema).max(20);
const messageMediaSchema = z.object({
  id: z.string().min(1).max(80),
  name: z.string().max(160),
  path: z.string().max(500),
  type: z.string().max(120),
});
const messageButtonSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().trim().min(1).max(40),
  value: z.string().max(120),
});
const messageTemplateSchema = z.object({
  kind: flowMessageKindSchema,
  text: z.string().max(1600),
  media: z.array(messageMediaSchema).max(5),
  buttons: z.array(messageButtonSchema).max(3),
  variables: z.array(z.string().trim().min(1).max(40)).max(20),
});
const messagesSchema = z.object({
  pix_generated: messageTemplateSchema,
  payment_approved: messageTemplateSchema,
  pix_expired: messageTemplateSchema,
  error: messageTemplateSchema,
  cancellation: messageTemplateSchema,
  social_proof: messageTemplateSchema,
});
const orderBumpImageSchema = z
  .object({
    name: z.string().max(160),
    path: z.string().max(500),
    type: z.string().max(120),
  })
  .nullable()
  .optional();
const orderBumpButtonSchema = z.object({
  id: z.string().min(1).max(80),
  label: z.string().trim().min(1).max(40),
  value: z.string().max(120),
});
const orderBumpOfferSchema = z.object({
  enabled: z.boolean(),
  title: z.string().max(80),
  priceCents: z.number().int().min(0).max(99999900),
  message: z.string().max(1200),
  image: orderBumpImageSchema,
  buttons: z.array(orderBumpButtonSchema).max(3),
  deliveryId: z.string().max(80).optional(),
});
const orderBumpsSchema = z.object({
  global: orderBumpOfferSchema,
  individual: z
    .array(
      orderBumpOfferSchema.extend({
        id: z.string().min(1).max(80),
        planId: z.string().min(1).max(80),
      }),
    )
    .max(10),
});
const upsellImageSchema = z
  .object({
    name: z.string().max(160),
    path: z.string().max(500),
    type: z.string().max(120),
  })
  .nullable()
  .optional();
const upsellSequenceSchema = z.object({
  id: z.string().min(1).max(80),
  delayMinutes: z.number().int().min(0).max(43200),
  message: z.string().max(1200),
  image: upsellImageSchema,
  button: z.object({
    label: z.string().trim().min(1).max(40),
    value: z.string().max(120),
  }),
  planId: z.string().max(80).optional(),
  deliveryId: z.string().max(80).optional(),
});
const upsellsSchema = z.array(upsellSequenceSchema).max(5);
const downsellsSchema = z.array(upsellSequenceSchema).max(20);
const basicEditorPayloadSchema = z.object({
  initialConfig: initialConfigSchema,
  planMessage: z.string().trim().min(1).max(500),
  plans: plansSchema,
  planDefaultDelivery: planDefaultDeliverySchema,
  planPriceVariation: planPriceVariationSchema,
  deliveries: deliveriesSchema,
  messages: messagesSchema,
  orderBumps: orderBumpsSchema,
  upsells: upsellsSchema,
  downsells: downsellsSchema,
});
const createFlowSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome do fluxo e obrigatorio.")
    .max(30, "Nome do fluxo deve ter no maximo 30 caracteres."),
  mode: z.literal("basic"),
});

function revalidateFlows(result: FlowActionResult) {
  if (result.ok) {
    revalidatePath("/flows");
    revalidatePath("/bots");
    revalidatePath("/dashboard");
  }

  return result;
}

export async function createFlowAction() {
  return revalidateFlows(await createFlow({ name: "Novo Fluxo", mode: "basic" }));
}

export async function createFlowFormAction() {
  await createFlowAction();
}

export async function createFlowFromDialogAction(formData: FormData) {
  const parsed = createFlowSchema.safeParse({
    name: formData.get("name"),
    mode: formData.get("mode"),
  });

  if (!parsed.success) return;

  const result = revalidateFlows(await createFlow(parsed.data));

  if (result.ok && result.flowId) {
    redirect(`/flows/${result.flowId}/editor/basic`);
  }
}

export async function duplicateFlowAction(flowId: string) {
  const parsed = flowIdSchema.safeParse(flowId);

  if (!parsed.success) return { ok: false, message: "Fluxo invalido." };

  return revalidateFlows(await duplicateFlow(parsed.data));
}

export async function duplicateFlowFormAction(formData: FormData) {
  const flowId = String(formData.get("flowId") ?? "");

  await duplicateFlowAction(flowId);
}

export async function archiveFlowAction(flowId: string) {
  const parsed = flowIdSchema.safeParse(flowId);

  if (!parsed.success) return { ok: false, message: "Fluxo invalido." };

  return revalidateFlows(await archiveFlow(parsed.data));
}

export async function archiveFlowFormAction(formData: FormData) {
  const flowId = String(formData.get("flowId") ?? "");

  await archiveFlowAction(flowId);
}

export async function updateFlowBotBindingsAction(
  flowId: string,
  botIds: string[],
) {
  const parsed = z
    .object({
      flowId: flowIdSchema,
      botIds: botIdsSchema,
    })
    .safeParse({ flowId, botIds });

  if (!parsed.success) {
    return { ok: false, message: "Vinculos invalidos." };
  }

  return revalidateFlows(
    await updateFlowBotBindings(parsed.data.flowId, parsed.data.botIds),
  );
}

export async function saveBasicFlowEditorAction(flowId: string, payload: unknown) {
  const parsed = z
    .object({
      flowId: flowIdSchema,
      payload: basicEditorPayloadSchema,
    })
    .safeParse({ flowId, payload });

  if (!parsed.success) {
    return { ok: false, message: "Erro ao salvar fluxo." };
  }

  const result = await saveBasicFlowEditorData(
    parsed.data.flowId,
    parsed.data.payload,
  );

  if (result.ok) {
    revalidatePath(`/flows/${parsed.data.flowId}/editor/basic`);
    revalidatePath("/flows");
    revalidatePath("/bots");
  }

  return result;
}

export async function publishFlowAction(flowId: string) {
  const parsed = flowIdSchema.safeParse(flowId);

  if (!parsed.success) return { ok: false, message: "Fluxo invalido." };

  const result = await publishFlow(parsed.data);

  if (result.ok) {
    revalidatePath(`/flows/${parsed.data}/editor/basic`);
    revalidatePath("/flows");
    revalidatePath("/bots");
  }

  return result;
}

export async function saveInitialConfigAction(
  flowId: string,
  config: unknown,
) {
  const parsed = z
    .object({
      flowId: flowIdSchema,
      config: initialConfigSchema,
    })
    .safeParse({ flowId, config });

  if (!parsed.success) {
    return { ok: false, message: "Configuracao invalida." };
  }

  return saveInitialConfig(parsed.data.flowId, parsed.data.config);
}

export async function uploadInitialConfigMediaAction(formData: FormData) {
  const parsed = z
    .object({
      flowId: flowIdSchema,
      kind: z.enum(["image", "video", "audio"]),
    })
    .safeParse({
      flowId: formData.get("flowId"),
      kind: formData.get("kind"),
    });
  const files = formData
    .getAll("files")
    .filter((file): file is File => file instanceof File);
  const legacyFile = formData.get("file");

  if (legacyFile instanceof File) {
    files.push(legacyFile);
  }

  if (!parsed.success || !files.length) {
    return { ok: false, message: "Midia invalida." };
  }

  if (parsed.data.kind !== "image" && files.length > 1) {
    return { ok: false, message: "Envie apenas um arquivo." };
  }

  if (parsed.data.kind === "image" && files.length > 5) {
    return { ok: false, message: "Envie no maximo 5 imagens." };
  }

  const acceptedTypes = {
    audio: ["audio/mpeg", "audio/ogg", "audio/wav", "audio/mp4", "audio/x-m4a"],
    image: ["image/jpeg", "image/png", "image/gif", "image/webp"],
    video: ["video/mp4", "video/x-msvideo", "video/quicktime", "video/webm"],
  };
  const maxSize = 10 * 1024 * 1024;

  if (
    files.some(
      (file) =>
        file.size > maxSize ||
        !acceptedTypes[parsed.data.kind].includes(file.type),
    )
  ) {
    return { ok: false, message: "Tipo ou tamanho de midia invalido." };
  }

  const uploaded = [];

  for (const file of files) {
    const result = await uploadInitialConfigMedia({
      flowId: parsed.data.flowId,
      kind: parsed.data.kind,
      file,
    });

    if (!result.ok || !("media" in result) || !result.media) return result;

    uploaded.push(result.media);
  }

  return { ok: true, message: "Midia enviada.", media: uploaded };
}

export async function saveFlowPlansAction(flowId: string, plans: unknown) {
  const parsed = z
    .object({
      flowId: flowIdSchema,
      plans: plansSchema,
    })
    .safeParse({ flowId, plans });

  if (!parsed.success) {
    return { ok: false, message: "Planos invalidos." };
  }

  return saveFlowPlans(parsed.data.flowId, parsed.data.plans);
}

export async function uploadFlowPlanImageAction(formData: FormData) {
  const parsed = z
    .object({
      flowId: flowIdSchema,
      planId: z.string().min(1).max(80),
    })
    .safeParse({
      flowId: formData.get("flowId"),
      planId: formData.get("planId"),
    });
  const file = formData.get("file");

  if (!parsed.success || !(file instanceof File)) {
    return { ok: false, message: "Imagem invalida." };
  }

  if (!file.type.startsWith("image/")) {
    return { ok: false, message: "Arquivo precisa ser uma imagem." };
  }

  return uploadFlowPlanImage({
    flowId: parsed.data.flowId,
    planId: parsed.data.planId,
    file,
  });
}

export async function saveFlowDeliveriesAction(
  flowId: string,
  deliveries: unknown,
) {
  const parsed = z
    .object({
      flowId: flowIdSchema,
      deliveries: deliveriesSchema,
    })
    .safeParse({ flowId, deliveries });

  if (!parsed.success) {
    return { ok: false, message: "Entregas invalidas." };
  }

  return saveFlowDeliveries(parsed.data.flowId, parsed.data.deliveries);
}

export async function uploadFlowDeliveryFileAction(formData: FormData) {
  const parsed = z
    .object({
      flowId: flowIdSchema,
      deliveryId: z.string().min(1).max(80),
    })
    .safeParse({
      flowId: formData.get("flowId"),
      deliveryId: formData.get("deliveryId"),
    });
  const file = formData.get("file");

  if (!parsed.success || !(file instanceof File)) {
    return { ok: false, message: "Arquivo invalido." };
  }

  return uploadFlowDeliveryFile({
    flowId: parsed.data.flowId,
    deliveryId: parsed.data.deliveryId,
    file,
  });
}

export async function saveFlowMessagesAction(
  flowId: string,
  messages: unknown,
) {
  const parsed = z
    .object({
      flowId: flowIdSchema,
      messages: messagesSchema,
    })
    .safeParse({ flowId, messages });

  if (!parsed.success) {
    return { ok: false, message: "Mensagens invalidas." };
  }

  return saveFlowMessages(parsed.data.flowId, parsed.data.messages);
}

export async function uploadFlowMessageMediaAction(formData: FormData) {
  const parsed = z
    .object({
      flowId: flowIdSchema,
      kind: flowMessageKindSchema,
    })
    .safeParse({
      flowId: formData.get("flowId"),
      kind: formData.get("kind"),
    });
  const file = formData.get("file");

  if (!parsed.success || !(file instanceof File)) {
    return { ok: false, message: "Midia invalida." };
  }

  return uploadFlowMessageMedia({
    file,
    flowId: parsed.data.flowId,
    kind: parsed.data.kind,
  });
}

export async function saveFlowOrderBumpsAction(
  flowId: string,
  orderBumps: unknown,
) {
  const parsed = z
    .object({
      flowId: flowIdSchema,
      orderBumps: orderBumpsSchema,
    })
    .safeParse({ flowId, orderBumps });

  if (!parsed.success) {
    return { ok: false, message: "Order bumps invalidos." };
  }

  return saveFlowOrderBumps(parsed.data.flowId, parsed.data.orderBumps);
}

export async function uploadFlowOrderBumpImageAction(formData: FormData) {
  const parsed = z
    .object({
      flowId: flowIdSchema,
      bumpId: z.string().min(1).max(80),
    })
    .safeParse({
      flowId: formData.get("flowId"),
      bumpId: formData.get("bumpId"),
    });
  const file = formData.get("file");

  if (!parsed.success || !(file instanceof File)) {
    return { ok: false, message: "Imagem invalida." };
  }

  if (!file.type.startsWith("image/")) {
    return { ok: false, message: "Arquivo precisa ser uma imagem." };
  }

  return uploadFlowOrderBumpImage({
    bumpId: parsed.data.bumpId,
    file,
    flowId: parsed.data.flowId,
  });
}

export async function saveFlowUpsellsAction(flowId: string, upsells: unknown) {
  const parsed = z
    .object({
      flowId: flowIdSchema,
      upsells: upsellsSchema,
    })
    .safeParse({ flowId, upsells });

  if (!parsed.success) {
    return { ok: false, message: "Upsells invalidos." };
  }

  return saveFlowUpsells(parsed.data.flowId, parsed.data.upsells);
}

export async function uploadFlowUpsellImageAction(formData: FormData) {
  const parsed = z
    .object({
      flowId: flowIdSchema,
      upsellId: z.string().min(1).max(80),
    })
    .safeParse({
      flowId: formData.get("flowId"),
      upsellId: formData.get("upsellId"),
    });
  const file = formData.get("file");

  if (!parsed.success || !(file instanceof File)) {
    return { ok: false, message: "Imagem invalida." };
  }

  if (!file.type.startsWith("image/")) {
    return { ok: false, message: "Arquivo precisa ser uma imagem." };
  }

  return uploadFlowUpsellImage({
    file,
    flowId: parsed.data.flowId,
    upsellId: parsed.data.upsellId,
  });
}

export async function saveFlowDownsellsAction(
  flowId: string,
  downsells: unknown,
) {
  const parsed = z
    .object({
      downsells: downsellsSchema,
      flowId: flowIdSchema,
    })
    .safeParse({ downsells, flowId });

  if (!parsed.success) {
    return { ok: false, message: "Downsells invalidos." };
  }

  return saveFlowDownsells(parsed.data.flowId, parsed.data.downsells);
}

export async function uploadFlowDownsellImageAction(formData: FormData) {
  const parsed = z
    .object({
      downsellId: z.string().min(1).max(80),
      flowId: flowIdSchema,
    })
    .safeParse({
      downsellId: formData.get("downsellId"),
      flowId: formData.get("flowId"),
    });
  const file = formData.get("file");

  if (!parsed.success || !(file instanceof File)) {
    return { ok: false, message: "Imagem invalida." };
  }

  if (!file.type.startsWith("image/")) {
    return { ok: false, message: "Arquivo precisa ser uma imagem." };
  }

  return uploadFlowDownsellImage({
    downsellId: parsed.data.downsellId,
    file,
    flowId: parsed.data.flowId,
  });
}
