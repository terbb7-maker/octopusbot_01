import type { RuntimeSupabase } from "@/server/services/workflow-runtime/types";
import type { PaymentStatus } from "@/server/services/workflow-runtime/types";

export class SandboxStatusResolver {
  constructor(private readonly supabase: RuntimeSupabase) {}

  async getStatus(paymentId: string): Promise<PaymentStatus> {
    const { data } = await this.supabase
      .from("payments")
      .select("status")
      .eq("id", paymentId)
      .eq("provider", "sandbox")
      .eq("environment", "sandbox")
      .maybeSingle();

    return data?.status ?? "failed";
  }
}
