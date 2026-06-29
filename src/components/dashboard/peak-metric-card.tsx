import type { LucideIcon } from "lucide-react";
import { CalendarDays, Clock3 } from "lucide-react";

import {
  DashboardCard,
  DashboardCardBody,
  DashboardCardHeader,
  Eyebrow,
} from "@/components/dashboard/dashboard-card";
import { EmptyState } from "@/components/dashboard/empty-state";
import { formatInteger } from "@/components/dashboard/format";
import type { PeakPoint } from "@/server/services/dashboard/types";

type PeakMetricCardProps = {
  title: string;
  description: string;
  icon: "clock" | "calendar";
  data: PeakPoint[];
};

const icons: Record<PeakMetricCardProps["icon"], LucideIcon> = {
  clock: Clock3,
  calendar: CalendarDays,
};

export function PeakMetricCard({
  title,
  description,
  icon,
  data,
}: PeakMetricCardProps) {
  const Icon = icons[icon];
  const max = Math.max(...data.map((point) => point.value), 1);
  const topPoint = data[0];

  return (
    <DashboardCard className="min-h-[360px]">
      <DashboardCardHeader>
        <div>
          <Eyebrow>{title}</Eyebrow>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex size-10 items-center justify-center rounded-md border border-white/10 bg-black/25 text-muted-foreground">
          <Icon className="size-5" aria-hidden="true" />
        </div>
      </DashboardCardHeader>

      <DashboardCardBody>
        {topPoint ? (
          <div className="space-y-5">
            <div className="flex min-h-40 flex-col justify-between rounded-md border border-primary/20 bg-primary/15 p-5 shadow-xl shadow-primary/10">
              <div className="text-right text-2xl font-semibold text-foreground">
                {formatInteger(topPoint.value)}
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-normal text-primary/80">
                  Principal pico
                </p>
                <p className="mt-2 text-lg font-semibold text-foreground">
                  {topPoint.label}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {data.map((point) => (
                <div key={point.label}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="truncate text-xs font-medium text-muted-foreground">
                      {point.label}
                    </span>
                    <span className="text-xs font-semibold text-foreground">
                      {formatInteger(point.value)}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/[0.04]">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.round((point.value / max) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={Icon}
            title={`${title} sem dados`}
            description="Os picos aparecerao quando houver pagamentos aprovados no periodo selecionado."
            className="min-h-[250px]"
          />
        )}
      </DashboardCardBody>
    </DashboardCard>
  );
}
