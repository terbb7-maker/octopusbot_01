import { getWorkspacePaymentGatewayConfig } from "@/server/adapters/payments/payment-provider-factory";
import type {
  RuntimeCheckout,
  RuntimeConfig,
  RuntimeSession,
  RuntimeSupabase,
} from "@/server/services/workflow-runtime/types";

export class CheckoutRuntime {
  constructor(private readonly supabase: RuntimeSupabase) {}

  async createDraft(input: {
    config: RuntimeConfig;
    planId: string;
    session: RuntimeSession;
    subtotalCents: number;
    upsellId?: string | null;
    downsellId?: string | null;
  }) {
    const { config, session } = input;
    const gateway = await getWorkspacePaymentGatewayConfig(
      this.supabase,
      config.workspaceId,
    );
    const { data, error } = await this.supabase
      .from("flow_checkouts")
      .insert({
        environment: gateway.provider === "sandbox" ? "sandbox" : "production",
        flow_id: config.flowId,
        flow_version_id: config.versionId,
        lead_id: session.lead_id,
        plan_id: input.planId,
        upsell_id: input.upsellId ?? null,
        downsell_id: input.downsellId ?? null,
        provider: gateway.provider,
        session_id: session.id,
        status: "draft",
        subtotal_cents: input.subtotalCents,
        telegram_bot_id: config.bot.id,
        total_cents: input.subtotalCents,
        workspace_id: config.workspaceId,
      })
      .select("*")
      .single();

    if (error || !data) throw new Error("Nao foi possivel criar o checkout.");

    return data as RuntimeCheckout;
  }

  async applyOrderBump(input: {
    checkout: RuntimeCheckout;
    orderBumpCents: number;
    orderBumpId: string;
  }) {
    const total = input.checkout.subtotal_cents + input.orderBumpCents;
    const { data, error } = await this.supabase
      .from("flow_checkouts")
      .update({
        order_bump_cents: input.orderBumpCents,
        order_bump_id: input.orderBumpId,
        total_cents: total,
      })
      .eq("id", input.checkout.id)
      .eq("workspace_id", input.checkout.workspace_id)
      .select("*")
      .single();

    if (error || !data) throw new Error("Nao foi possivel atualizar o checkout.");

    return data as RuntimeCheckout;
  }

  async loadCheckout(checkoutId: string, workspaceId: string) {
    const { data } = await this.supabase
      .from("flow_checkouts")
      .select("*")
      .eq("id", checkoutId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    return (data ?? null) as RuntimeCheckout | null;
  }

  async markPaymentCreated(checkout: RuntimeCheckout, paymentId: string) {
    const { data, error } = await this.supabase
      .from("flow_checkouts")
      .update({
        payment_id: paymentId,
        payment_status: "pending",
        status: "payment_created",
      })
      .eq("id", checkout.id)
      .eq("workspace_id", checkout.workspace_id)
      .select("*")
      .single();

    if (error || !data) throw new Error("Nao foi possivel atualizar o pagamento.");

    return data as RuntimeCheckout;
  }

  async markPaid(checkout: RuntimeCheckout) {
    await this.supabase
      .from("flow_checkouts")
      .update({ payment_status: "approved", status: "paid" })
      .eq("id", checkout.id)
      .eq("workspace_id", checkout.workspace_id);
  }
}
