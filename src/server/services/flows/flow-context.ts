import { redirect } from "next/navigation";

import type { SupabaseServer } from "@/server/services/bots/bot-context";

export async function getAuthenticatedFlowWorkspace(supabase: SupabaseServer) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("default_workspace_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.default_workspace_id) {
    return { userId: user.id, workspaceId: profile.default_workspace_id };
  }

  const { data: membership } = await supabase
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return { userId: user.id, workspaceId: membership?.workspace_id ?? null };
}
