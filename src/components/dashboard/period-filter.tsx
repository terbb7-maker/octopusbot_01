import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { cn } from "@/lib/utils";
import type { DashboardPeriod } from "@/server/services/dashboard/types";

type PeriodFilterProps = {
  activePeriod: DashboardPeriod;
  customFrom?: string;
  customTo?: string;
};

const periods: Array<{
  label: string;
  value: DashboardPeriod;
  href: string;
}> = [
  { label: "Hoje", value: "today", href: "/dashboard" },
  { label: "Ontem", value: "yesterday", href: "/dashboard?period=yesterday" },
  { label: "7 dias", value: "7d", href: "/dashboard?period=7d" },
  { label: "30 dias", value: "30d", href: "/dashboard?period=30d" },
  {
    label: "Personalizado",
    value: "custom",
    href: "/dashboard?period=custom",
  },
];

export function PeriodFilter({
  activePeriod,
  customFrom,
  customTo,
}: PeriodFilterProps) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
      <nav
        aria-label="Filtro por periodo"
        className="grid w-full grid-cols-2 rounded-md border border-white/10 bg-black/25 p-1 shadow-lg shadow-black/10 sm:w-auto sm:auto-cols-fr sm:grid-flow-col sm:grid-cols-none"
      >
        {periods.slice(0, 4).map((period) => (
          <Link
            key={period.value}
            href={period.href}
            className={cn(
              "inline-flex h-9 items-center justify-center rounded-sm px-3 text-xs font-semibold text-muted-foreground transition-colors hover:bg-white/[0.06] hover:text-foreground",
              activePeriod === period.value &&
                "bg-white/[0.09] text-foreground shadow-sm shadow-black/20",
            )}
          >
            {period.label}
          </Link>
        ))}
      </nav>

      <Link
        href="/dashboard?period=custom"
        className={cn(
          "inline-flex h-11 w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-black/25 px-4 text-xs font-semibold text-muted-foreground shadow-lg shadow-black/10 transition-colors hover:bg-white/[0.06] hover:text-foreground sm:w-auto",
          activePeriod === "custom" && "bg-white/[0.09] text-foreground",
        )}
      >
        <CalendarDays className="size-4" aria-hidden="true" />
        Personalizado
      </Link>

      {activePeriod === "custom" ? (
        <form
          action="/dashboard"
          className="grid w-full grid-cols-2 gap-2 rounded-md border border-white/10 bg-black/25 p-2 sm:w-auto sm:grid-cols-[140px_140px_auto]"
        >
          <input type="hidden" name="period" value="custom" />
          <input
            type="date"
            name="from"
            defaultValue={customFrom}
            aria-label="Data inicial"
            className="h-9 rounded-sm border border-white/10 bg-black/30 px-3 text-xs text-foreground outline-none transition-colors focus:border-primary"
          />
          <input
            type="date"
            name="to"
            defaultValue={customTo}
            aria-label="Data final"
            className="h-9 rounded-sm border border-white/10 bg-black/30 px-3 text-xs text-foreground outline-none transition-colors focus:border-primary"
          />
          <button
            type="submit"
            className="col-span-2 inline-flex h-9 items-center justify-center rounded-sm bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 sm:col-span-1"
          >
            Aplicar
          </button>
        </form>
      ) : null}
    </div>
  );
}
