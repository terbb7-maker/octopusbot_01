import Link from "next/link";

import { appConfig } from "@/config/app";
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
import { signInAction } from "@/features/auth/actions";

type LoginPageProps = {
  searchParams?: Promise<{
    error?: string;
    next?: string;
    success?: string;
  }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;

  return (
    <AuthShell>
      <Card className="mx-auto w-full max-w-sm">
        <CardHeader>
          <CardTitle>Entrar no {appConfig.name}</CardTitle>
          <CardDescription>
            Acesse o painel para operar vendas pelo Telegram.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={signInAction} className="space-y-4">
            <AuthFormMessage error={params?.error} success={params?.success} />
            {params?.next ? (
              <input type="hidden" name="next" value={params.next} />
            ) : null}
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
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
            <AuthSubmitButton pendingText="Entrando...">Entrar</AuthSubmitButton>
            <div className="flex justify-between text-xs text-muted-foreground">
              <Link href="/reset-password" className="hover:text-foreground">
                Esqueci minha senha
              </Link>
              <Link href="/register" className="hover:text-foreground">
                Criar conta
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthShell>
  );
}
