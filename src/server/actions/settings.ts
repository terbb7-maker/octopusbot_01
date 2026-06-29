"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { updatePaymentGatewaySettings } from "@/server/services/settings/payment-gateway-settings-service";

const paymentGatewaySettingsSchema = z.object({
  provider: z.enum([
    "sandbox",
    "pushinpay",
    "bspay",
    "gothampay",
    "ativopay",
    "woovi",
  ]),
  sandboxResult: z.enum(["always_approve", "always_pending"]),
});

export async function updatePaymentGatewaySettingsAction(input: unknown) {
  const parsed = paymentGatewaySettingsSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, message: "Configuracao invalida." };
  }

  const result = await updatePaymentGatewaySettings(parsed.data);

  if (result.ok) {
    revalidatePath("/settings");
  }

  return result;
}
