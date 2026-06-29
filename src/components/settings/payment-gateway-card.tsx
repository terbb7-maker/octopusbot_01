"use client";

import { useState, useTransition } from "react";
import { CreditCard, Loader2, ShieldCheck } from "lucide-react";

import { updatePaymentGatewaySettingsAction } from "@/server/actions/settings";
import type { PaymentGatewaySettings } from "@/server/services/settings/payment-gateway-settings-service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";

const gatewayOptions = [
  { disabled: false, label: "Sandbox", value: "sandbox" },
  { disabled: true, label: "PushinPay", value: "pushinpay" },
  { disabled: true, label: "BSPay", value: "bspay" },
  { disabled: true, label: "GothamPay", value: "gothampay" },
  { disabled: true, label: "AtivoPay", value: "ativopay" },
  { disabled: true, label: "Woovi", value: "woovi" },
] as const;

function relativeDate(value: string | null) {
  if (!value) return "Nenhum teste";

  const diffMs = Date.now() - new Date(value).getTime();
  const minutes = Math.max(1, Math.round(diffMs / 60000));

  return minutes === 1 ? "Ha 1 minuto" : `Ha ${minutes} minutos`;
}

export function PaymentGatewayCard({ settings }: { settings: PaymentGatewaySettings }) {
  const [provider, setProvider] = useState(settings.provider);
  const [sandboxResult, setSandboxResult] = useState(settings.sandboxResult);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updatePaymentGatewaySettingsAction({
        provider,
        sandboxResult,
      });
      setMessage(result.message);
    });
  }

  return (
    <Card className="border-white/10 bg-card/80 shadow-2xl shadow-black/20">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="size-5 text-violet-300" aria-hidden="true" />
              Gateway de Pagamento
            </CardTitle>
            <CardDescription>
              Configure o provider PIX usado pelos fluxos publicados.
            </CardDescription>
          </div>
          <Badge className="border-yellow-400/30 bg-yellow-400/10 text-yellow-200">
            Modo Teste
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="payment-provider">Provider</Label>
          <select
            id="payment-provider"
            className="h-10 w-full rounded-md border border-white/10 bg-background px-3 text-sm outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            value={provider}
            onChange={(event) => setProvider(event.target.value as typeof provider)}
          >
            {gatewayOptions.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}{option.disabled ? " - Em breve" : ""}
              </option>
            ))}
          </select>
        </div>

        {provider === "sandbox" ? (
          <div className="rounded-lg border border-violet-300/15 bg-violet-500/10 p-4">
            <div className="mb-4 flex items-start gap-3">
              <ShieldCheck className="mt-0.5 size-5 text-violet-200" aria-hidden="true" />
              <div>
                <h3 className="font-semibold text-foreground">Modo Sandbox</h3>
                <p className="text-sm text-muted-foreground">
                  Configure o comportamento dos pagamentos de teste.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sandbox-result">Resultado da Cobranca</Label>
              <select
                id="sandbox-result"
                className="h-10 w-full rounded-md border border-white/10 bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={sandboxResult}
                onChange={(event) =>
                  setSandboxResult(event.target.value as typeof sandboxResult)
                }
              >
                <option value="always_approve">Sempre Aprovar</option>
                <option value="always_pending">Sempre Pendente</option>
              </select>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-4">
          <Metric label="Transacoes" value={settings.sandboxAnalytics.transactions} />
          <Metric label="Aprovadas" value={settings.sandboxAnalytics.approved} />
          <Metric label="Pendentes" value={settings.sandboxAnalytics.pending} />
          <Metric
            label="Ultimo Teste"
            value={relativeDate(settings.sandboxAnalytics.lastTestAt)}
          />
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Transacoes Sandbox nunca entram nas metricas financeiras de producao.
          </p>
          <Button type="button" onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            Salvar Gateway
          </Button>
        </div>
        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
