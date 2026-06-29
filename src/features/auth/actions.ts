"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getPublicEnv } from "@/lib/security/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { ensureAuthenticatedUserWorkspace } from "@/features/auth/provisioning";

const emailSchema = z.string().trim().email("Informe um email valido.");
const passwordSchema = z
  .string()
  .min(8, "A senha deve ter pelo menos 8 caracteres.");
const nameSchema = z
  .string()
  .trim()
  .min(2, "Informe seu nome.")
  .max(120, "O nome deve ter no maximo 120 caracteres.");

function readString(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value : "";
}

function redirectWithMessage(
  path: string,
  type: "error" | "success",
  message: string,
): never {
  redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

function sanitizeNextPath(nextPath: string) {
  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/dashboard";
  }

  return nextPath;
}

export async function signUpAction(formData: FormData) {
  const parsed = z
    .object({
      name: nameSchema,
      email: emailSchema,
      password: passwordSchema,
    })
    .safeParse({
      name: readString(formData, "name"),
      email: readString(formData, "email"),
      password: readString(formData, "password"),
    });

  if (!parsed.success) {
    redirectWithMessage(
      "/register",
      "error",
      parsed.error.issues[0]?.message ?? "Revise os dados do cadastro.",
    );
  }

  const supabase = await createSupabaseServerClient();
  const env = getPublicEnv();
  const { name, email, password } = parsed.data;

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        full_name: name,
      },
      emailRedirectTo: `${env.appUrl}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    redirectWithMessage("/register", "error", error.message);
  }

  if (data.session) {
    const provisioning = await ensureAuthenticatedUserWorkspace(supabase);

    if (!provisioning.ok) {
      redirectWithMessage(
        "/login",
        "error",
        provisioning.error ?? "Nao foi possivel preparar sua conta.",
      );
    }

    redirect("/dashboard");
  }

  redirectWithMessage(
    "/login",
    "success",
    "Cadastro criado. Verifique seu email para confirmar a conta.",
  );
}

export async function signInAction(formData: FormData) {
  const parsed = z
    .object({
      email: emailSchema,
      password: z.string().min(1, "Informe sua senha."),
    })
    .safeParse({
      email: readString(formData, "email"),
      password: readString(formData, "password"),
    });
  const next = sanitizeNextPath(readString(formData, "next"));

  if (!parsed.success) {
    redirectWithMessage(
      "/login",
      "error",
      parsed.error.issues[0]?.message ?? "Revise os dados de login.",
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    redirectWithMessage("/login", "error", error.message);
  }

  const provisioning = await ensureAuthenticatedUserWorkspace(supabase);

  if (!provisioning.ok) {
    redirectWithMessage(
      "/login",
      "error",
      provisioning.error ?? "Nao foi possivel preparar sua conta.",
    );
  }

  redirect(next);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();

  await supabase.auth.signOut();

  redirect("/login");
}

export async function requestPasswordResetAction(formData: FormData) {
  const parsed = emailSchema.safeParse(readString(formData, "email"));

  if (!parsed.success) {
    redirectWithMessage(
      "/reset-password",
      "error",
      parsed.error.issues[0]?.message ?? "Informe um email valido.",
    );
  }

  const supabase = await createSupabaseServerClient();
  const env = getPublicEnv();
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, {
    redirectTo: `${env.appUrl}/auth/callback?next=/update-password`,
  });

  if (error) {
    redirectWithMessage("/reset-password", "error", error.message);
  }

  redirectWithMessage(
    "/reset-password",
    "success",
    "Enviamos as instrucoes de recuperacao para seu email.",
  );
}

export async function updatePasswordAction(formData: FormData) {
  const password = readString(formData, "password");
  const passwordConfirmation = readString(formData, "password_confirmation");

  const parsed = passwordSchema.safeParse(password);

  if (!parsed.success) {
    redirectWithMessage(
      "/update-password",
      "error",
      parsed.error.issues[0]?.message ?? "Informe uma senha valida.",
    );
  }

  if (password !== passwordConfirmation) {
    redirectWithMessage(
      "/update-password",
      "error",
      "A confirmacao de senha nao confere.",
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    redirectWithMessage("/update-password", "error", error.message);
  }

  redirectWithMessage(
    "/login",
    "success",
    "Senha atualizada. Entre novamente para continuar.",
  );
}
