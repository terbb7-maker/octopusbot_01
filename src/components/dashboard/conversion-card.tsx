import { MousePointerClick, TrendingUp } from "lucide-react";

import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  Eyebrow,
} from "@/components/dashboard/dashboard-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatInteger, formatPercent } from "@/components/dashboard/format";
import type { DashboardData } from "@/server/services/dashboard/types";

type ConversionCardProps = {
  conversion: DashboardData["conversion"];
  hasData: boolean;
};

export function ConversionCard({ conversion, hasData }: ConversionCardProps) {
  return (
    <DashboardCard className="min-h-[360px]">
      <DashboardCardHeader>
        <div>
          <Eyebrow>Conversao</Eyebrow>
          <p className="mt-2 text-sm text-muted-foreground">
            Do start no bot ate o PIX aprovado.
          </p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
          <TrendingUp className="size-5" aria-hidden="true" />
        </div>
      </DashboardCardHeader>

      <DashboardCardBody className="flex min-h-[260px] flex-col justify-between gap-5">
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <p className="text-6xl font-semibold leading-none text-rose-300">
            {formatPercent(conversion.currentRate)}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            Conversao do periodo
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3 text-xs text-muted-foreground">
            <span>{formatInteger(conversion.startCount)} starts</span>
            <span className="text-white/20">/</span>
            <span>{formatInteger(conversion.paidCount)} PIX pagos</span>
          </div>
        </div>

        <div className="grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
          <ConversionMiniMetric
            label="Ultimos 7d"
            value={formatPercent(conversion.last7DaysRate)}
          />
          <ConversionMiniMetric
            label="Ultimos 30d"
            value={formatPercent(conversion.last30DaysRate)}
          />
        </div>

        {!hasData ? (
          <EmptyState
            icon={MousePointerClick}
            title="Conversao aguardando dados"
            description="A taxa sera calculada quando houver starts do bot e pagamentos aprovados."
          />
        ) : null}
      </DashboardCardBody>
    </DashboardCard>
  );
}

function ConversionMiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-black/25 p-4">
      <p className="text-xs font-semibold uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-rose-300">{value}</p>
    </div>
  );
}
