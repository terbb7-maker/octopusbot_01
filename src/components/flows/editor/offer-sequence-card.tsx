"use client";

import { ImagePlus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  FlowDelivery,
  FlowPlan,
  FlowUpsellSequence,
} from "@/server/services/flows";

type OfferSequenceCardProps = {
  deliveries: FlowDelivery[];
  emptyTitle: string;
  imageLabel: string;
  index: number;
  messagePlaceholder: string;
  onChange: (sequence: FlowUpsellSequence) => void;
  onImageUpload: (file: File) => void;
  onRemove: () => void;
  plans: FlowPlan[];
  sequence: FlowUpsellSequence;
};

export function OfferSequenceCard({
  deliveries,
  emptyTitle,
  imageLabel,
  index,
  messagePlaceholder,
  onChange,
  onImageUpload,
  onRemove,
  plans,
  sequence,
}: OfferSequenceCardProps) {
  return (
    <article className="rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-normal text-primary">
            Sequencia {index + 1}
          </p>
          <h3 className="mt-1 text-base font-semibold text-foreground">
            {sequence.message || emptyTitle}
          </h3>
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-white/10 text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Field label="Delay (minutos)">
            <Input
              type="number"
              min="0"
              max="43200"
              value={sequence.delayMinutes}
              onChange={(event) =>
                onChange({
                  ...sequence,
                  delayMinutes: Math.max(0, Number(event.target.value) || 0),
                })
              }
            />
          </Field>
          <Field label="Plano">
            <select
              value={sequence.planId ?? ""}
              onChange={(event) =>
                onChange({ ...sequence, planId: event.target.value })
              }
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
          <Field label="Entrega">
            <select
              value={sequence.deliveryId ?? ""}
              onChange={(event) =>
                onChange({ ...sequence, deliveryId: event.target.value })
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
        </div>

        <Field label="Mensagem">
          <Textarea
            value={sequence.message}
            maxLength={1200}
            onChange={(event) =>
              onChange({ ...sequence, message: event.target.value })
            }
            placeholder={messagePlaceholder}
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
          <span className="truncate">{sequence.image?.name ?? imageLabel}</span>
        </label>

        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Texto do botao">
            <Input
              value={sequence.button.label}
              maxLength={40}
              onChange={(event) =>
                onChange({
                  ...sequence,
                  button: { ...sequence.button, label: event.target.value },
                })
              }
              placeholder="Ver oferta"
            />
          </Field>
          <Field label="Acao do botao">
            <Input
              value={sequence.button.value}
              maxLength={120}
              onChange={(event) =>
                onChange({
                  ...sequence,
                  button: { ...sequence.button, value: event.target.value },
                })
              }
              placeholder="view_offer"
            />
          </Field>
        </div>
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
