import { Bot, CircleDollarSign, TrendingUp } from "lucide-react";

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

type PixPaidSummaryCardProps = {
  summary: DashboardData["summary"];
  hasData: boolean;
};

export function PixPaidSummaryCard({
  summary,
  hasData,
}: PixPaidSummaryCardProps) {
  const delta = formatDelta(
    summary.pixPaidTodayCents,
    summary.pixPaidYesterdayCents,
  );

  return (
    <DashboardCard className="min-h-[360px]">
      <DashboardCardHeader>
        <div>
          <Eyebrow>PIX pagos hoje + starts no bot</Eyebrow>
          <p className="mt-2 text-sm text-muted-foreground">
            Receita confirmada e volume de entrada do Telegram.
          </p>
        </div>
        <div className="inline-flex items-center gap-1 rounded-md border border-emerald-400/15 bg-emerald-400/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
          <TrendingUp className="size-3.5" aria-hidden="true" />
          {delta}
        </div>
      </DashboardCardHeader>

      <DashboardCardBody className="flex h-full flex-col justify-between gap-8">
        <div className="grid gap-6 lg:grid-cols-[1fr_220px] lg:items-end">
          <div>
            <p className="text-5xl font-semibold leading-none text-foreground sm:text-6xl lg:text-7xl">
              {formatCurrencyFromCents(summary.pixPaidTodayCents)}
            </p>
            <p className="mt-4 text-sm font-medium text-muted-foreground">
              Ontem:{" "}
              <span className="text-foreground">
                {formatCurrencyFromCents(summary.pixPaidYesterdayCents)}
              </span>
            </p>
          </div>

          <div className="rounded-md border border-white/10 bg-black/25 p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
                <Bot className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
                  Starts no bot
                </p>
                <p className="mt-1 text-3xl font-semibold text-foreground">
                  {formatInteger(summary.botStarts)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
          <SummaryItem
            label="Semana"
            value={formatCurrencyFromCents(summary.pixPaidWeekCents)}
          />
          <SummaryItem
            label="Mes"
            value={formatCurrencyFromCents(summary.pixPaidMonthCents)}
            featured
          />
          <SummaryItem
            label="Total geral"
            value={formatCurrencyFromCents(summary.pixPaidTotalCents)}
          />
        </div>

        {!hasData ? (
          <EmptyState
            icon={CircleDollarSign}
            title="Nenhum PIX pago ainda"
            description="Assim que um pagamento for aprovado, a receita e os starts aparecem aqui em tempo real."
          />
        ) : null}
      </DashboardCardBody>
    </DashboardCard>
  );
}

function SummaryItem({
  label,
  value,
  featured,
}: {
  label: string;
  value: string;
  featured?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p
        className={
          featured
            ? "mt-2 text-xl font-semibold text-primary"
            : "mt-2 text-xl font-semibold text-foreground"
        }
      >
        {value}
      </p>
    </div>
  );
}
