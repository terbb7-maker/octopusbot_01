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
import { updatePasswordAction } from "@/features/auth/actions";

type UpdatePasswordPageProps = {
  searchParams?: Promise<{
    error?: string;
    success?: string;
  }>;
};

export default async function UpdatePasswordPage({
  searchParams,
}: UpdatePasswordPageProps) {
  const params = await searchParams;

  return (
    <AuthShell>
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle>Definir nova senha</CardTitle>
          <CardDescription>
            Crie uma nova senha para recuperar o acesso ao painel.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updatePasswordAction} className="space-y-4">
            <AuthFormMessage error={params?.error} success={params?.success} />
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password_confirmation">Confirmar senha</Label>
              <Input
                id="password_confirmation"
                name="password_confirmation"
                type="password"
                minLength={8}
                required
              />
            </div>
            <AuthSubmitButton pendingText="Atualizando...">
              Atualizar senha
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
