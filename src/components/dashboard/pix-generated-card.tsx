import { QrCode, TrendingUp } from "lucide-react";

import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  Eyebrow,
} from "@/components/dashboard/dashboard-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import {
  formatCurrencyFromCents,
  formatDelta,
  formatInteger,
} from "@/components/dashboard/format";
import type { DashboardData } from "@/server/services/dashboard/types";

type PixGeneratedCardProps = {
  pixGenerated: DashboardData["pixGenerated"];
  hasData: boolean;
};

export function PixGeneratedCard({
  pixGenerated,
  hasData,
}: PixGeneratedCardProps) {
  return (
    <DashboardCard className="min-h-[360px]">
      <DashboardCardHeader>
        <div>
          <Eyebrow>PIX gerados</Eyebrow>
          <p className="mt-2 text-sm text-muted-foreground">
            Cobrancas criadas pelo fluxo de venda.
          </p>
        </div>
        <span className="rounded-md border border-white/10 bg-black/25 px-2 py-1 text-xs font-semibold text-muted-foreground">
          Hoje
        </span>
      </DashboardCardHeader>

      <DashboardCardBody className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-5xl font-semibold leading-none text-foreground sm:text-6xl">
              {formatCurrencyFromCents(pixGenerated.amountCents)}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Ontem:{" "}
              <span className="text-foreground">
                {formatCurrencyFromCents(pixGenerated.yesterdayAmountCents)}
              </span>
            </p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-md border border-emerald-400/15 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
            <TrendingUp className="size-3.5" aria-hidden="true" />
            {formatDelta(
              pixGenerated.amountCents,
              pixGenerated.yesterdayAmountCents,
            )}
          </div>
        </div>

        <div className="grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <MiniMetric
            label="PIX pagos"
            value={formatCurrencyFromCents(pixGenerated.paidAmountCents)}
          />
          <MiniMetric
            label="Gerados"
            value={formatInteger(pixGenerated.generatedCount)}
          />
        </div>

        <div className="space-y-4 border-t border-white/10 pt-4">
          <ProgressRow
            label="PIX gerados (qtd)"
            value={pixGenerated.generatedCount}
            max={Math.max(pixGenerated.generatedCount, pixGenerated.paidCount, 1)}
          />
          <ProgressRow
            label="PIX pagos (qtd)"
            value={pixGenerated.paidCount}
            max={Math.max(pixGenerated.generatedCount, pixGenerated.paidCount, 1)}
            accent
          />
        </div>

        {!hasData ? (
          <EmptyState
            icon={QrCode}
            title="Nenhum PIX gerado"
            description="Quando um cliente iniciar uma compra, as cobrancas geradas serao exibidas neste painel."
          />
        ) : null}
      </DashboardCardBody>
    </DashboardCard>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-white/10 bg-black/25 p-4">
      <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-foreground">{value}</p>
    </div>
  );
}

function ProgressRow({
  label,
  value,
  max,
  accent,
}: {
  label: string;
  value: number;
  max: number;
  accent?: boolean;
}) {
  const width = `${Math.round((value / max) * 100)}%`;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
          {label}
        </p>
        <span
          className={accent ? "text-sm text-primary" : "text-sm text-foreground"}
        >
          {formatInteger(value)}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-white/[0.04]">
        <div
          className={
            accent
              ? "h-full rounded-full bg-primary"
              : "h-full rounded-full bg-white/20"
          }
          style={{ width }}
        />
      </div>
    </div>
  );
}
