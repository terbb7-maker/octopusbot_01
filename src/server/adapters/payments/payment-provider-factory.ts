import { SandboxPaymentProvider } from "@/server/adapters/payments/sandbox/sandbox-payment-provider";
import { runtimeLog } from "@/server/services/workflow-runtime/runtime-logger";
import type {
  PaymentProvider,
  RuntimeSupabase,
} from "@/server/services/workflow-runtime/types";
import type {
  PaymentGatewayProvider,
  SandboxPaymentResult,
} from "@/types/database/commerce-tables";

export type WorkspacePaymentGatewayConfig = {
  provider: PaymentGatewayProvider;
  sandboxResult: SandboxPaymentResult;
};

export async function getWorkspacePaymentGatewayConfig(
  supabase: RuntimeSupabase,
  workspaceId: string,
): Promise<WorkspacePaymentGatewayConfig> {
  const { data } = await supabase
    .from("workspace_payment_settings")
    .select("provider,sandbox_result")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (!data) {
    const { data: created } = await supabase
      .from("workspace_payment_settings")
      .insert({
        provider: "sandbox",
        sandbox_result: "always_approve",
        workspace_id: workspaceId,
      })
      .select("provider,sandbox_result")
      .single();

    return {
      provider: created?.provider ?? "sandbox",
      sandboxResult: created?.sandbox_result ?? "always_approve",
    };
  }

  return {
    provider: data.provider,
    sandboxResult: data.sandbox_result,
  };
}

export async function createPaymentProvider(
  supabase: RuntimeSupabase,
  workspaceId: string,
): Promise<PaymentProvider> {
  const config = await getWorkspacePaymentGatewayConfig(supabase, workspaceId);

  runtimeLog("Gateway utilizada", {
    provider: config.provider,
    sandboxResult: config.sandboxResult,
    workspaceId,
  });

  if (config.provider !== "sandbox") {
    throw new Error("Gateway de pagamento indisponivel.");
  }

  return new SandboxPaymentProvider(supabase, config.sandboxResult);
}
