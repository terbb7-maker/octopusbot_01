import { Bot, PauseCircle, Radio } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BotsOverview } from "@/server/services/bots";

const stats = [
  { key: "totalBots", label: "Total de Bots", icon: Bot },
  { key: "activeBots", label: "Bots Ativos", icon: Radio },
  { key: "inactiveBots", label: "Bots Inativos", icon: PauseCircle },
] as const;

export function BotStats({ overview }: { overview: BotsOverview }) {
  return (
    <section className="grid gap-4 md:grid-cols-3">
      {stats.map((stat) => {
        const Icon = stat.icon;

        return (
          <Card key={stat.key}>
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
              <CardTitle className="text-sm text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className="flex size-9 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
                <Icon className="size-4" aria-hidden="true" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold text-foreground">
                {overview[stat.key]}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </section>
  );
}
