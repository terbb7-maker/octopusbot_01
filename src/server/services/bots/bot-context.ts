import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SupabaseServer = Awaited<ReturnType<typeof createSupabaseServerClient>>;

export async function getAuthenticatedWorkspace(supabase: SupabaseServer) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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

export async function auditBotAction(
  supabase: SupabaseServer,
  workspaceId: string,
  userId: string,
  action: string,
  botId: string,
) {
  await supabase.from("audit_logs").insert({
    workspace_id: workspaceId,
    actor_id: userId,
    action,
    entity_type: "telegram_bot",
    entity_id: botId,
    metadata: {},
  });
}
