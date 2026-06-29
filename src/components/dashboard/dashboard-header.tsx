import { BarChart3, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PeriodFilter } from "@/components/dashboard/period-filter";
import type { DashboardPeriod } from "@/server/services/dashboard/types";

type DashboardHeaderProps = {
  period: DashboardPeriod;
  updatedAt: string;
  customFrom?: string;
  customTo?: string;
  refreshHref?: string;
};

export function DashboardHeader({
  period,
  updatedAt,
  customFrom,
  customTo,
  refreshHref = "/dashboard",
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary shadow-lg shadow-primary/10">
          <BarChart3 className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-normal text-foreground sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Atualizado {updatedAt}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <PeriodFilter
          activePeriod={period}
          customFrom={customFrom}
          customTo={customTo}
        />
        <Button
          asChild
          variant="outline"
          size="icon"
          className="hidden h-11 w-11 border-white/10 bg-black/25 text-muted-foreground hover:bg-white/[0.06] hover:text-foreground sm:inline-flex"
        >
          <a href={refreshHref} aria-label="Atualizar dashboard">
            <RefreshCw className="size-4" aria-hidden="true" />
          </a>
        </Button>
      </div>
    </header>
  );
}
