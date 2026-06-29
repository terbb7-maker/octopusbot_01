import Link from "next/link";

import { AuthFormMessage } from "@/components/auth/auth-form-message";
import { AuthShell } from "@/components/auth/auth-shell";
import { AuthSubmitButton } from "@/components/auth/auth-submit-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordResetAction } from "@/features/auth/actions";

type ResetPasswordPageProps = {
  searchParams?: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;

  return (
    <AuthShell>
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle>Recuperar senha</CardTitle>
          <CardDescription>
            Informe o email da conta para receber as instrucoes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={requestPasswordResetAction} className="space-y-4">
            <AuthFormMessage error={params?.error} success={params?.success} />
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="voce@empresa.com"
                autoComplete="email"
                required
              />
            </div>
            <AuthSubmitButton pendingText="Enviando...">
              Enviar instrucoes
            </AuthSubmitButton>
            <Link
              href="/login"
              className="block text-center text-xs text-muted-foreground hover:text-foreground"
            >
              Voltar para login
            </Link>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
