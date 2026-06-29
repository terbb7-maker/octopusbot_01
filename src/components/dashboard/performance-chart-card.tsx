import { LineChart } from "lucide-react";

import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  Eyebrow,
} from "@/components/dashboard/dashboard-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PerformanceAreaChart } from "@/components/dashboard/performance-area-chart";
import { cn } from "@/lib/utils";
import type { PerformancePoint } from "@/server/services/dashboard/types";

type PerformanceChartCardProps = {
  data: PerformancePoint[];
  hasData: boolean;
};

export function PerformanceChartCard({
  data,
  hasData,
}: PerformanceChartCardProps) {
  const hasChartData = data.some(
    (point) => point.pixGerados > 0 || point.pixPagos > 0 || point.starts > 0,
  );

  return (
    <DashboardCard className="min-h-[360px]">
      <DashboardCardHeader>
        <div>
          <Eyebrow>Performance</Eyebrow>
          <p className="mt-2 text-sm text-muted-foreground">
            Evolucao de starts, PIX gerados e PIX pagos.
          </p>
        </div>
        <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
          <Legend colorClassName="bg-primary" label="Starts" />
          <Legend colorClassName="bg-amber-400" label="Gerados" />
          <Legend colorClassName="bg-emerald-400" label="Pagos" />
        </div>
      </DashboardCardHeader>

      <DashboardCardBody>
        {hasData && hasChartData ? (
          <div className="h-[250px]">
            <PerformanceAreaChart data={data} />
          </div>
        ) : (
          <EmptyState
            icon={LineChart}
            title="Performance sem dados"
            description="O grafico sera preenchido quando houver starts, cobrancas PIX e pagamentos aprovados."
            className="min-h-[250px]"
          />
        )}
      </DashboardCardBody>
    </DashboardCard>
  );
}

function Legend({
  colorClassName,
  label,
}: {
  colorClassName: string;
  label: string;
}) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={cn("size-2 rounded-full", colorClassName)} />
      {label}
    </span>
  );
}
