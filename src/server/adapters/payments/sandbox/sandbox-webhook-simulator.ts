import type { RuntimeSupabase } from "@/server/services/workflow-runtime/types";
import { toJson } from "@/server/services/workflow-runtime/types";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class SandboxWebhookSimulator {
  constructor(private readonly supabase: RuntimeSupabase) {}

  async approveAfterDelay(input: {
    delayMs?: number;
    paymentId: string;
    providerPaymentId: string;
    workspaceId: string;
  }) {
    await wait(input.delayMs ?? 1000);

    const paidAt = new Date().toISOString();

    await this.supabase
      .from("payments")
      .update({
        approved_at: paidAt,
        status: "approved",
      })
      .eq("id", input.paymentId)
      .eq("workspace_id", input.workspaceId)
      .eq("provider", "sandbox")
      .eq("environment", "sandbox")
      .eq("status", "pending");

    await this.supabase
      .from("pix_charges")
      .update({
        paid_at: paidAt,
        status: "paid",
      })
      .eq("payment_id", input.paymentId)
      .eq("workspace_id", input.workspaceId)
      .eq("provider", "sandbox")
      .eq("environment", "sandbox")
      .eq("status", "pending");

    await this.supabase.from("payment_events").insert({
      environment: "sandbox",
      event_type: "sandbox.pix.paid",
      payload: toJson({
        paidAt,
        status: "PAID",
      }),
      payment_id: input.paymentId,
      provider: "sandbox",
      provider_event_id: `${input.providerPaymentId}:paid`,
      processing_status: "processed",
      processed_at: paidAt,
      workspace_id: input.workspaceId,
    });
  }
}
