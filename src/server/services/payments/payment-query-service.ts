import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import type { PaymentEnvironment } from "@/types/database/commerce-tables";

export type PaymentListItem = {
  amountCents: number;
  createdAt: string;
  environment: PaymentEnvironment;
  id: string;
  provider: string;
  status: string;
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

export async function getRecentPayments(): Promise<PaymentListItem[]> {
  const workspaceId = await getCurrentWorkspaceId();
  if (!workspaceId) return [];

  const admin = getSupabaseServiceRoleClient();
  const { data } = await admin
    .from("payments")
    .select("id,amount_cents,status,provider,environment,created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false })
    .limit(30);

  return (data ?? []).map((row) => ({
    amountCents: row.amount_cents,
    createdAt: row.created_at,
    environment: row.environment,
    id: row.id,
    provider: row.provider,
    status: row.status,
  }));
}
