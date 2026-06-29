import { billingTypeLabel, formatCurrency } from "@/components/flows/editor/plan-formatters";
import { cn } from "@/lib/utils";
import type { FlowPlan } from "@/server/services/flows";

type PlanCardProps = {
  active: boolean;
  plan: FlowPlan;
  onSelect: () => void;
};

export function PlanCard({ active, onSelect, plan }: PlanCardProps) {
  const deliveryLabel = plan.useDefaultDelivery
    ? "Entrega padrao"
    : plan.deliveryType === "telegram_group"
      ? "Grupo Telegram"
      : plan.deliveryType === "telegram_channel"
        ? "Canal Telegram"
        : plan.deliveryType === "link"
          ? "Link"
          : "Mensagem";

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "rounded-lg border border-white/10 bg-black/20 p-4 text-left transition-colors hover:bg-white/[0.04]",
        active && "border-primary/60 bg-primary/10",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-foreground">
            {plan.name || "Plano sem nome"}
          </h3>
          <p className="mt-1 text-lg font-semibold text-primary">
            {formatCurrency(plan.priceCents)}
          </p>
        </div>
        <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-muted-foreground">
          {billingTypeLabel(plan.billingType)}
        </span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
        <span>{deliveryLabel}</span>
        <span>{plan.stats.pixPaid} vendas</span>
        <span>{formatCurrency(plan.stats.revenueCents)}</span>
      </div>
    </button>
  );
}
