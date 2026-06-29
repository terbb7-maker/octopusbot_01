import { ImagePlus, Trash2 } from "lucide-react";

import { ButtonColorPicker, buttonColorHex } from "@/components/flows/editor/button-color-picker";
import { DeliverySelector } from "@/components/flows/editor/delivery-selector";
import {
  centsToInput,
  inputToCents,
} from "@/components/flows/editor/plan-formatters";
import { PlanStats } from "@/components/flows/editor/plan-stats";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  FlowPlan,
  FlowPlanBillingType,
  TelegramDeliveryDestination,
} from "@/server/services/flows";

type PlanEditorProps = {
  plan: FlowPlan;
  destinations: TelegramDeliveryDestination[];
  onChange: (plan: FlowPlan) => void;
  onImageUpload: (file: File) => void;
  onRemove: () => void;
};

const billingTypes: Array<{ label: string; value: FlowPlanBillingType }> = [
  { label: "Vitalicio", value: "lifetime" },
  { label: "Mensal", value: "monthly" },
  { label: "Trimestral", value: "quarterly" },
  { label: "Semestral", value: "semiannual" },
  { label: "Anual", value: "annual" },
];

export function PlanEditor({
  destinations,
  onChange,
  onImageUpload,
  onRemove,
  plan,
}: PlanEditorProps) {
  return (
    <article className="rounded-lg border border-white/10 bg-black/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Cadastro do Plano
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure nome, preco, entrega e comportamento comercial.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-white/10 text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Remover
        </Button>
      </div>

      <div className="mt-5 grid gap-5">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Nome do plano">
            <Input
              value={plan.name}
              maxLength={80}
              onChange={(event) => onChange({ ...plan, name: event.target.value })}
              placeholder="Ex: Tarifa de Adesao"
            />
          </Field>
          <Field label="Preco">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={centsToInput(plan.priceCents)}
              onChange={(event) =>
                onChange({ ...plan, priceCents: inputToCents(event.target.value) })
              }
            />
          </Field>
          <Field label="Tipo do plano">
            <select
              value={plan.billingType}
              onChange={(event) =>
                onChange({
                  ...plan,
                  billingType: event.target.value as FlowPlanBillingType,
                })
              }
              className="h-10 rounded-md border border-white/10 bg-black/30 px-3 text-sm text-foreground outline-none"
            >
              {billingTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Texto do botao">
          <Input
            value={plan.buttonLabel}
            maxLength={40}
            onChange={(event) =>
              onChange({ ...plan, buttonLabel: event.target.value })
            }
            placeholder="Escolher plano"
          />
        </Field>

        <ButtonColorPicker
          value={plan.buttonColor}
          onChange={(buttonColor) =>
            onChange({
              ...plan,
              buttonColor,
              color: buttonColorHex(buttonColor),
            })
          }
        />

        <label className="flex cursor-pointer items-center gap-3 rounded-md border border-white/10 bg-white/[0.035] p-3 text-sm text-muted-foreground">
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImageUpload(file);
              event.target.value = "";
            }}
          />
          <ImagePlus className="size-4 text-primary" aria-hidden="true" />
          <span className="truncate">
            {plan.image?.name ?? "Adicionar imagem do plano"}
          </span>
        </label>

        <DeliverySelector
          config={plan.deliveryConfig}
          destinations={destinations}
          type={plan.deliveryType}
          onChange={(deliveryType, deliveryConfig) =>
            onChange({
              ...plan,
              deliveryConfig,
              deliveryType,
              useDefaultDelivery: deliveryType === "default",
            })
          }
        />

        <section className="grid gap-3">
          <h3 className="text-sm font-semibold text-foreground">Order Bump</h3>
          <label className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.035] p-4 text-sm">
            <span>Usar Order Bump Global</span>
            <input
              type="checkbox"
              checked={plan.useGlobalOrderBump}
              onChange={(event) =>
                onChange({
                  ...plan,
                  orderBump: { ...plan.orderBump, enabled: !event.target.checked },
                  useGlobalOrderBump: event.target.checked,
                })
              }
            />
          </label>
          {!plan.useGlobalOrderBump ? (
            <div className="rounded-md border border-white/10 bg-primary/10 p-4 text-sm text-muted-foreground">
              Order Bump Individual ativado para este plano. A configuracao
              detalhada sera feita no modulo Order Bump.
            </div>
          ) : null}
        </section>

        <PlanStats stats={plan.stats} />
      </div>
    </article>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
