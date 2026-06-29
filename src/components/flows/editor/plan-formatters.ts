import type { FlowPlanBillingType } from "@/server/services/flows";

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(cents / 100);
}

export function billingTypeLabel(type: FlowPlanBillingType) {
  const labels: Record<FlowPlanBillingType, string> = {
    annual: "Anual",
    lifetime: "Vitalicio",
    monthly: "Mensal",
    quarterly: "Trimestral",
    semiannual: "Semestral",
  };

  return labels[type];
}

export function inputToCents(value: string) {
  const normalized = value.replace(",", ".");
  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 100)) : 0;
}

export function centsToInput(cents: number) {
  return (cents / 100).toFixed(2);
}
