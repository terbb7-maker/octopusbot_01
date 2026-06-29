import { PaymentGatewayCard } from "@/components/settings/payment-gateway-card";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getPaymentGatewaySettings } from "@/server/services/settings/payment-gateway-settings-service";

export default async function SettingsPage() {
  const paymentGatewaySettings = await getPaymentGatewaySettings();

  return (
    <>
      <PageHeader
        title="Configuracoes"
        description="Dados operacionais do workspace e integracoes sensiveis."
      />
      <div className="mx-auto grid w-full max-w-[1500px] gap-4 p-4 sm:p-6 lg:grid-cols-2 lg:p-8">
        <div className="lg:col-span-2">
          <PaymentGatewayCard settings={paymentGatewaySettings} />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Workspace</CardTitle>
            <CardDescription>
              Base multi-tenant que isola usuarios, bots e vendas.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="workspace-name">Nome</Label>
              <Input id="workspace-name" placeholder="Minha operacao" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Seguranca</CardTitle>
            <CardDescription>
              Secrets devem ficar apenas no servidor e na Vercel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tokens de bot, service role e credenciais PIX nunca devem ser
              expostos ao navegador.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
