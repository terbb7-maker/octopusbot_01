import { GitBranch, Layers3, Link2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { FlowsOverview } from "@/server/services/flows";

const statCards = [
  {
    key: "linkedFlows",
    label: "Fluxos Vinculados",
    icon: Link2,
  },
  {
    key: "basicFlows",
    label: "Fluxos Basicos",
    icon: GitBranch,
  },
  {
    key: "advancedFlows",
    label: "Fluxos Avancados",
    icon: Layers3,
  },
] as const;

export function FlowStats({ overview }: { overview: FlowsOverview }) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {statCards.map((stat) => {
        const Icon = stat.icon;

        return (
          <Card key={stat.key} className="overflow-hidden">
            <div className="relative p-5">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.16),transparent_36%)]" />
              <div className="relative flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="mt-3 text-3xl font-semibold text-foreground">
                    {overview[stat.key]}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </section>
  );
}
