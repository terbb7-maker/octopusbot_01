"use client";

import { ImagePlus, Trash2 } from "lucide-react";

import { OrderBumpButtonsField } from "@/components/flows/editor/order-bump-buttons-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  FlowDelivery,
  FlowOrderBumpOffer,
  FlowPlan,
} from "@/server/services/flows";

type OrderBumpOfferCardProps = {
  bumpId: string;
  deliveries: FlowDelivery[];
  offer: FlowOrderBumpOffer;
  planId?: string;
  plans?: FlowPlan[];
  title: string;
  onChange: (offer: FlowOrderBumpOffer) => void;
  onImageUpload: (file: File) => void;
  onPlanChange?: (planId: string) => void;
  onRemove?: () => void;
};

function centsToInput(cents: number) {
  return String((cents / 100).toFixed(2));
}

function inputToCents(value: string) {
  const parsed = Number(value.replace(",", "."));

  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 100)) : 0;
}

export function OrderBumpOfferCard({
  bumpId,
  deliveries,
  offer,
  planId,
  plans = [],
  title,
  onChange,
  onImageUpload,
  onPlanChange,
  onRemove,
}: OrderBumpOfferCardProps) {
  return (
    <article className="rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-normal text-primary">
            {title}
          </p>
          <h3 className="mt-1 text-base font-semibold text-foreground">
            {offer.title || "Oferta adicional"}
          </h3>
        </div>
        {onRemove ? (
          <Button
            type="button"
            variant="outline"
            className="border-white/10 text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        ) : null}
      </div>

      <div className="grid gap-4">
        <label className="flex items-center gap-2 text-sm font-medium text-foreground">
          <input
            type="checkbox"
            checked={offer.enabled}
            onChange={(event) =>
              onChange({ ...offer, enabled: event.target.checked })
            }
          />
          Ativar order bump
        </label>

        {onPlanChange ? (
          <Field label="Plano vinculado">
            <select
              value={planId ?? ""}
              onChange={(event) => onPlanChange(event.target.value)}
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" className="bg-background">
                Selecionar plano
              </option>
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id} className="bg-background">
                  {plan.name}
                </option>
              ))}
            </select>
          </Field>
        ) : null}

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Titulo">
            <Input
              value={offer.title}
              maxLength={80}
              onChange={(event) =>
                onChange({ ...offer, title: event.target.value })
              }
              placeholder="Ex: Adicione o pacote VIP"
            />
          </Field>
          <Field label="Preco">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={centsToInput(offer.priceCents)}
              onChange={(event) =>
                onChange({
                  ...offer,
                  priceCents: inputToCents(event.target.value),
                })
              }
            />
          </Field>
        </div>

        <Field label="Mensagem">
          <Textarea
            value={offer.message}
            maxLength={1200}
            onChange={(event) =>
              onChange({ ...offer, message: event.target.value })
            }
            placeholder="Explique a oferta complementar antes do pagamento."
          />
        </Field>

        <label className="flex cursor-pointer items-center gap-3 rounded-md border border-white/10 bg-white/[0.035] p-3 text-sm text-muted-foreground">
          <input
            type="file"
            accept="image/*"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onImageUpload(file);
            }}
          />
          <ImagePlus className="size-4 text-primary" aria-hidden="true" />
          <span className="truncate">
            {offer.image?.name ?? `Adicionar imagem (${bumpId})`}
          </span>
        </label>

        <Field label="Entrega">
          <select
            value={offer.deliveryId ?? ""}
            onChange={(event) =>
              onChange({ ...offer, deliveryId: event.target.value })
            }
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="" className="bg-background">
              Sem entrega vinculada
            </option>
            {deliveries.map((delivery) => (
              <option key={delivery.id} value={delivery.id} className="bg-background">
                {delivery.name}
              </option>
            ))}
          </select>
        </Field>

        <OrderBumpButtonsField
          buttons={offer.buttons}
          onChange={(buttons) => onChange({ ...offer, buttons })}
        />
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
