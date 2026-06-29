import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getRecentPayments } from "@/server/services/payments/payment-query-service";

function money(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(cents / 100);
}

export default async function PaymentsPage() {
  const payments = await getRecentPayments();

  return (
    <>
      <PageHeader
        title="Pagamentos"
        description="Monitore cobranças PIX, aprovacoes e eventos do gateway."
      />
      <div className="mx-auto w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
        <Card className="border-white/10 bg-card/80">
          <CardHeader>
            <CardTitle>Ultimas cobrancas</CardTitle>
            <CardDescription>
              Cobrancas Sandbox aparecem com badge para evitar confusao com vendas reais.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {payments.length ? (
              <div className="divide-y divide-white/10 rounded-lg border border-white/10">
                {payments.map((payment) => (
                  <div
                    key={payment.id}
                    className="grid gap-3 p-4 text-sm sm:grid-cols-[1fr_auto_auto]"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {money(payment.amountCents)}
                      </p>
                      <p className="text-muted-foreground">
                        {payment.provider} · {payment.status}
                      </p>
                    </div>
                    {payment.environment === "sandbox" ? (
                      <Badge className="w-fit border-yellow-400/30 bg-yellow-400/10 text-yellow-200">
                        Modo Teste
                      </Badge>
                    ) : (
                      <Badge className="w-fit border-emerald-400/30 bg-emerald-400/10 text-emerald-200">
                        Producao
                      </Badge>
                    )}
                    <span className="text-muted-foreground">
                      {new Date(payment.createdAt).toLocaleString("pt-BR")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-white/15 bg-black/20 p-6 text-sm leading-6 text-muted-foreground">
                Confirmacoes do gateway PIX aparecerao nesta tela.
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
