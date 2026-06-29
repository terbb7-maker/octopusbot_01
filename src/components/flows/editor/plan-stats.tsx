import { formatCurrency } from "@/components/flows/editor/plan-formatters";
import type { FlowPlanStats } from "@/server/services/flows";

export function PlanStats({ stats }: { stats: FlowPlanStats }) {
  const items = [
    ["Leads", String(stats.leads)],
    ["PIX Gerados", String(stats.pixGenerated)],
    ["PIX Pagos", String(stats.pixPaid)],
    ["Conversao", `${stats.conversionRate.toFixed(1)}%`],
    ["Receita", formatCurrency(stats.revenueCents)],
  ];

  return (
    <div className="grid gap-2 sm:grid-cols-5">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-md border border-white/10 bg-black/20 p-3">
          <p className="text-[11px] uppercase tracking-normal text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-sm font-semibold text-foreground">{value}</p>
        </div>
      ))}
    </div>
  );
}
