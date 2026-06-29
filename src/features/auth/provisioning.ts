"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service-role";

type SupabaseServerClient = Awaited<
  ReturnType<typeof createSupabaseServerClient>
>;

function buildWorkspaceName(name: string | null, email: string) {
  if (name) {
    return `Workspace de ${name}`;
  }

  return `Workspace de ${email.split("@")[0] ?? "usuario"}`;
}

function buildWorkspaceSlug(userId: string, name: string | null, email: string) {
  const base = (name ?? email.split("@")[0] ?? "workspace")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return `${base || "workspace"}-${userId.replaceAll("-", "").slice(0, 8)}`;
}

export async function ensureAuthenticatedUserWorkspace(
  supabase?: SupabaseServerClient,
) {
  const client = supabase ?? (await createSupabaseServerClient());
  const adminClient = getSupabaseServiceRoleClient();
  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError || !user) {
    return { ok: false, error: "Usuario nao autenticado." };
  }

  const email = user.email ?? "";
  const metadataName =
    typeof user.user_metadata?.name === "string"
      ? user.user_metadata.name.trim()
      : "";
  const fullName =
    metadataName ||
    (typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name.trim()
      : "");
  const name = fullName || null;

  const { data: profile } = await adminClient
    .from("profiles")
    .select("id, default_workspace_id")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile) {
    const { error } = await adminClient
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email,
          name,
        },
        { onConflict: "id" },
      );

    if (error) {
      return { ok: false, error: error.message };
    }
  }

  const { data: existingMembership } = await adminClient
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  const workspaceId =
    profile?.default_workspace_id ?? existingMembership?.workspace_id;

  if (workspaceId) {
    if (!profile?.default_workspace_id) {
      await adminClient
        .from("profiles")
        .update({ default_workspace_id: workspaceId })
        .eq("id", user.id);
    }

    return { ok: true, workspaceId };
  }

  const { data: workspace, error: workspaceError } = await adminClient
    .from("workspaces")
    .insert({
      owner_id: user.id,
      name: buildWorkspaceName(name, email),
      slug: buildWorkspaceSlug(user.id, name, email),
    })
    .select("id")
    .single();

  if (workspaceError || !workspace) {
    return {
      ok: false,
      error: workspaceError?.message ?? "Nao foi possivel criar o workspace.",
    };
  }

  const { error: memberError } = await adminClient
    .from("workspace_members")
    .upsert(
      {
        workspace_id: workspace.id,
        user_id: user.id,
        role: "owner",
        status: "active",
      },
      { onConflict: "workspace_id,user_id" },
    );

  if (memberError) {
    return { ok: false, error: memberError.message };
  }

  await adminClient
    .from("profiles")
    .update({ default_workspace_id: workspace.id })
    .eq("id", user.id);

  return { ok: true, workspaceId: workspace.id };
}
