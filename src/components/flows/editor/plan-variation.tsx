import type { FlowPlanPriceVariation } from "@/server/services/flows";

type PlanVariationProps = {
  value: FlowPlanPriceVariation;
  onChange: (value: FlowPlanPriceVariation) => void;
};

export function PlanVariation({ onChange, value }: PlanVariationProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-black/20 p-5">
      <h3 className="text-base font-semibold text-foreground">
        Variacao de Preco
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Preco unico por cliente para conciliacao automatica de PIX.
      </p>
      <label className="mt-5 flex items-center justify-between gap-4 rounded-md border border-white/10 bg-white/[0.035] p-4 text-sm text-foreground">
        <span>Ativar variacao automatica</span>
        <input
          type="checkbox"
          checked={value.enabled}
          onChange={(event) =>
            onChange({ ...value, enabled: event.target.checked })
          }
        />
      </label>
      {value.enabled ? (
        <div className="mt-4 rounded-md border border-white/10 bg-white/[0.025] p-4 text-sm text-muted-foreground">
          Exemplo: R$ 6,90, R$ 6,91, R$ 6,92, sempre dentro da faixa de
          centavos configurada.
        </div>
      ) : null}
    </section>
  );
}
