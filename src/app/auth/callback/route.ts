import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureAuthenticatedUserWorkspace } from "@/features/auth/provisioning";

function sanitizeNextPath(nextPath: string | null) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/dashboard";
  }

  return nextPath;
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = sanitizeNextPath(requestUrl.searchParams.get("next"));

  if (!code) {
    redirect("/login?error=Link%20de%20autenticacao%20invalido.");
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }

  const provisioning = await ensureAuthenticatedUserWorkspace(supabase);

  if (!provisioning.ok) {
    redirect(
      `/login?error=${encodeURIComponent(
        provisioning.error ?? "Nao foi possivel preparar sua conta.",
      )}`,
    );
  }

  redirect(next);
}
