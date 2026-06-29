import { SandboxPixGenerator } from "@/server/adapters/payments/sandbox/sandbox-pix-generator";
import { SandboxQrGenerator } from "@/server/adapters/payments/sandbox/sandbox-qr-generator";
import { SandboxStatusResolver } from "@/server/adapters/payments/sandbox/sandbox-status-resolver";
import { SandboxWebhookSimulator } from "@/server/adapters/payments/sandbox/sandbox-webhook-simulator";
import type {
  PaymentProvider,
  PaymentStatus,
  PixPayment,
  RuntimeSupabase,
} from "@/server/services/workflow-runtime/types";
import { toJson } from "@/server/services/workflow-runtime/types";
import type { SandboxPaymentResult } from "@/types/database/commerce-tables";

export class SandboxPaymentProvider implements PaymentProvider {
  private readonly pixGenerator = new SandboxPixGenerator();
  private readonly qrGenerator = new SandboxQrGenerator();
  private readonly statusResolver: SandboxStatusResolver;
  private readonly webhookSimulator: SandboxWebhookSimulator;

  constructor(
    private readonly supabase: RuntimeSupabase,
    private readonly resultMode: SandboxPaymentResult,
  ) {
    this.statusResolver = new SandboxStatusResolver(supabase);
    this.webhookSimulator = new SandboxWebhookSimulator(supabase);
  }

  async createPix(input: {
    checkoutId: string;
    currency: "BRL";
    flowId: string;
    planId: string;
    sessionId: string;
    totalCents: number;
    workspaceId: string;
  }): Promise<PixPayment> {
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const providerPaymentId = `sandbox_${crypto.randomUUID()}`;
    const { data: payment, error } = await this.supabase
      .from("payments")
      .insert({
        amount_cents: input.totalCents,
        checkout_id: input.checkoutId,
        currency: input.currency,
        environment: "sandbox",
        expires_at: expiresAt,
        flow_id: input.flowId,
        flow_plan_id: input.planId,
        method: "pix",
        metadata: toJson({
          mode: this.resultMode,
          providerPaymentId,
          sandbox: true,
        }),
        provider: "sandbox",
        provider_payment_id: providerPaymentId,
        revenue_kind: "bundle",
        session_id: input.sessionId,
        status: "pending",
        workspace_id: input.workspaceId,
      })
      .select("id")
      .single();

    if (error || !payment) throw new Error("Nao foi possivel gerar o PIX.");

    const pix = this.pixGenerator.create({
      amountCents: input.totalCents,
      expiresAt,
      paymentId: payment.id,
      workspaceId: input.workspaceId,
    });
    const qrCodeBase64 = this.qrGenerator.createBase64(pix.qrCode);

    const { error: pixError } = await this.supabase.from("pix_charges").insert({
      copy_paste: pix.copyPaste,
      environment: "sandbox",
      expires_at: expiresAt,
      payment_id: payment.id,
      provider: "sandbox",
      provider_charge_id: pix.transactionId,
      qr_code: pix.qrCode,
      qr_code_base64: qrCodeBase64,
      status: "pending",
      workspace_id: input.workspaceId,
    });

    if (pixError) throw new Error("Nao foi possivel registrar o PIX.");

    if (this.resultMode === "always_approve") {
      await this.webhookSimulator.approveAfterDelay({
        paymentId: payment.id,
        providerPaymentId,
        workspaceId: input.workspaceId,
      });
    }

    return {
      copyPaste: pix.copyPaste,
      expiresAt,
      paymentId: payment.id,
      qrCode: pix.qrCode,
      qrCodeBase64,
      status: await this.getStatus(payment.id),
      transactionId: pix.transactionId,
    };
  }

  async getStatus(paymentId: string): Promise<PaymentStatus> {
    return this.statusResolver.getStatus(paymentId);
  }

  async cancelPix(paymentId: string) {
    await this.supabase
      .from("payments")
      .update({ status: "cancelled" })
      .eq("id", paymentId)
      .eq("provider", "sandbox")
      .eq("environment", "sandbox")
      .eq("status", "pending");

    await this.supabase
      .from("pix_charges")
      .update({ status: "cancelled" })
      .eq("payment_id", paymentId)
      .eq("provider", "sandbox")
      .eq("environment", "sandbox")
      .eq("status", "pending");
  }
}
