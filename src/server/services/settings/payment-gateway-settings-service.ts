import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type {
  PaymentGatewayProvider,
  SandboxPaymentResult,
} from "@/types/database/commerce-tables";

export type PaymentGatewaySettings = {
  provider: PaymentGatewayProvider;
  sandboxResult: SandboxPaymentResult;
  sandboxAnalytics: {
    approved: number;
    lastTestAt: string | null;
    pending: number;
    transactions: number;
  };
  workspaceId: string | null;
};

async function getCurrentWorkspaceId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const admin = getSupabaseServiceRoleClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("default_workspace_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.default_workspace_id) return profile.default_workspace_id;

  const { data: membership } = await admin
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return membership?.workspace_id ?? null;
}

async function ensureSettings(workspaceId: string) {
  const admin = getSupabaseServiceRoleClient();
  const { data } = await admin
    .from("workspace_payment_settings")
    .select("provider,sandbox_result")
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (data) return data;

  const { data: created } = await admin
    .from("workspace_payment_settings")
    .insert({
      provider: "sandbox",
      sandbox_result: "always_approve",
      workspace_id: workspaceId,
    })
    .select("provider,sandbox_result")
    .single();

  return created ?? { provider: "sandbox", sandbox_result: "always_approve" };
}

async function getSandboxAnalytics(workspaceId: string) {
  const admin = getSupabaseServiceRoleClient();
  const { data } = await admin
    .from("payments")
    .select("status,created_at")
    .eq("workspace_id", workspaceId)
    .eq("environment", "sandbox")
    .order("created_at", { ascending: false });
  const rows = data ?? [];

  return {
    approved: rows.filter((row) => row.status === "approved").length,
    lastTestAt: rows[0]?.created_at ?? null,
    pending: rows.filter((row) => row.status === "pending").length,
    transactions: rows.length,
  };
}

export async function getPaymentGatewaySettings(): Promise<PaymentGatewaySettings> {
  const workspaceId = await getCurrentWorkspaceId();

  if (!workspaceId) {
    return {
      provider: "sandbox",
      sandboxAnalytics: {
        approved: 0,
        lastTestAt: null,
        pending: 0,
        transactions: 0,
      },
      sandboxResult: "always_approve",
      workspaceId: null,
    };
  }

  const [settings, sandboxAnalytics] = await Promise.all([
    ensureSettings(workspaceId),
    getSandboxAnalytics(workspaceId),
  ]);

  return {
    provider: settings.provider,
    sandboxAnalytics,
    sandboxResult: settings.sandbox_result,
    workspaceId,
  };
}

export async function updatePaymentGatewaySettings(input: {
  provider: PaymentGatewayProvider;
  sandboxResult: SandboxPaymentResult;
}) {
  const workspaceId = await getCurrentWorkspaceId();
  if (!workspaceId) return { ok: false, message: "Workspace nao encontrado." };

  if (input.provider !== "sandbox") {
    return { ok: false, message: "Gateway ainda nao disponivel." };
  }

  const admin = getSupabaseServiceRoleClient();
  const { error } = await admin.from("workspace_payment_settings").upsert(
    {
      provider: "sandbox",
      sandbox_result: input.sandboxResult,
      workspace_id: workspaceId,
    },
    { onConflict: "workspace_id" },
  );

  if (error) return { ok: false, message: "Nao foi possivel salvar." };

  return { ok: true, message: "Gateway salvo com sucesso." };
}
