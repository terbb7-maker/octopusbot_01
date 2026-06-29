import { PlanCard } from "@/components/flows/editor/plan-card";
import type { FlowPlan } from "@/server/services/flows";

type PlanListProps = {
  activePlanId: string | null;
  plans: FlowPlan[];
  onSelect: (planId: string) => void;
};

export function PlanList({ activePlanId, onSelect, plans }: PlanListProps) {
  if (!plans.length) {
    return (
      <div className="rounded-lg border border-dashed border-white/15 bg-black/20 p-6 text-sm text-muted-foreground">
        Nenhum plano criado. Adicione um plano para iniciar a configuracao.
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {plans.map((plan) => (
        <PlanCard
          key={plan.id}
          active={activePlanId === plan.id}
          plan={plan}
          onSelect={() => onSelect(plan.id)}
        />
      ))}
    </div>
  );
}
