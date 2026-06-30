"use client";

import { Copy, ListTree, Trash2 } from "lucide-react";

import { ButtonConfigField } from "@/components/flows/editor/button-config-field";
import { CollapsibleCard } from "@/components/flows/editor/collapsible-card";
import { DelayField } from "@/components/flows/editor/delay-field";
import { ExclusivePlansEditor } from "@/components/flows/editor/exclusive-plans-editor";
import { MediaUploader } from "@/components/flows/editor/media-uploader";
import { OrderBumpOfferCard } from "@/components/flows/editor/order-bump-offer-card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  FlowOrderBumpOffer,
  FlowPlan,
  FlowUpsellSequence,
  TelegramDeliveryDestination,
} from "@/server/services/flows";

type OfferSequenceCardProps = {
  destinations: TelegramDeliveryDestination[];
  flowId: string;
  index: number;
  onChange: (sequence: FlowUpsellSequence) => void;
  onDuplicate: () => void;
  onRemove: () => void;
  sequence: FlowUpsellSequence;
};

function createExclusivePlan(): FlowPlan {
  const id = crypto.randomUUID();

  return {
    active: false,
    billingType: "lifetime",
    buttonColor: "default",
    buttonLabel: "Comprar agora",
    color: "#a855f7",
    deliveryConfig: {},
    deliveryType: "custom_message",
    description: "",
    id,
    image: null,
    name: "Plano exclusivo",
    order: 0,
    orderBump: { enabled: false },
    orderBumpId: null,
    priceCents: 0,
    stats: {
      conversionRate: 0,
      leads: 0,
      pixGenerated: 0,
      pixPaid: 0,
      revenueCents: 0,
    },
    useDefaultDelivery: false,
    useGlobalOrderBump: true,
  };
}

function createOrderBump(): FlowOrderBumpOffer {
  return {
    acceptButtonColor: "auto",
    acceptButtonText: "✅ Quero aproveitar",
    buttons: [],
    declineButtonColor: "auto",
    declineButtonText: "❌ Continuar sem bônus",
    deliveryConfig: {},
    deliveryId: "",
    deliveryType: "default",
    enabled: true,
    image: null,
    media: { type: "image", groupImages: false, images: [] },
    message: "",
    priceCents: 0,
    title: "Oferta adicional",
  };
}

function orderBumpLabel(mode: FlowUpsellSequence["orderBumpMode"]) {
  if (mode === "global") return "Global";
  if (mode === "exclusive") return "Exclusivo";
  return "Nenhum";
}

export function OfferSequenceCard({
  destinations,
  flowId,
  index,
  onChange,
  onDuplicate,
  onRemove,
  sequence,
}: OfferSequenceCardProps) {
  const exclusivePlans = sequence.exclusivePlans ?? [];
  const delayValue = sequence.delayValue ?? sequence.delayMinutes ?? 0;
  const delayUnit = sequence.delayUnit === "seconds" ? "segundos" : "minutos";

  function updateExclusivePlan(plan: FlowPlan) {
    onChange({
      ...sequence,
      exclusivePlans: exclusivePlans.map((item) =>
        item.id === plan.id ? plan : item,
      ),
    });
  }

  return (
    <CollapsibleCard
      defaultOpen={index === 0}
      icon={ListTree}
      storageKey={`flow-sequence:${sequence.id}`}
      title={`Sequencia ${index + 1}`}
      summary={
        <span className="flex flex-wrap gap-x-4 gap-y-1">
          <span>Delay: {delayValue} {delayUnit}</span>
          <span>Planos: {exclusivePlans.length}</span>
          <span>Order Bump: {orderBumpLabel(sequence.orderBumpMode)}</span>
          <span>Obrigatorio: {sequence.required ? "Sim" : "Nao"}</span>
        </span>
      }
      actions={
        <>
          <Button
            type="button"
            variant="outline"
            className="border-white/10"
            onClick={onDuplicate}
          >
            <Copy className="size-4" aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-white/10 text-destructive"
            onClick={onRemove}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </Button>
        </>
      }
    >
      <div className="grid gap-5">
        <DelayField
          value={delayValue}
          unit={sequence.delayUnit ?? "minutes"}
          onChange={(delay) =>
            onChange({
              ...sequence,
              delayUnit: delay.unit,
              delayValue: delay.value,
              delayMinutes:
                delay.unit === "seconds" ? delay.value / 60 : delay.value,
            })
          }
        />

        <Field label="Mensagem">
          <Textarea
            value={sequence.message}
            maxLength={1200}
            onChange={(event) =>
              onChange({ ...sequence, message: event.target.value })
            }
            placeholder="Escreva a mensagem enviada nesta etapa de upsell."
          />
        </Field>

        <MediaUploader
          folder={`upsells/${sequence.id}`}
          flowId={flowId}
          media={sequence.media}
          onChange={(media) => onChange({ ...sequence, media })}
        />

        <label className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.035] p-4 text-sm">
          <span>
            <span className="block font-medium text-foreground">
              Tornar Upsell obrigatório
            </span>
            <span className="text-xs text-muted-foreground">
              Esconde completamente o botão de recusar.
            </span>
          </span>
          <input
            type="checkbox"
            checked={sequence.required}
            onChange={(event) =>
              onChange({ ...sequence, required: event.target.checked })
            }
          />
        </label>

        <div className="grid gap-3 lg:grid-cols-2">
          <ButtonConfigField
            title="Botão aceitar"
            label={sequence.button.label}
            color={sequence.button.color ?? "auto"}
            onChange={(button) =>
              onChange({
                ...sequence,
                button: { ...sequence.button, color: button.color, label: button.label },
              })
            }
          />
          {!sequence.required ? (
            <ButtonConfigField
              title="Botão recusar"
              label={sequence.declineButton?.label ?? "❌ Não quero"}
              color={sequence.declineButton?.color ?? "auto"}
              onChange={(button) =>
                onChange({
                  ...sequence,
                  declineButton: {
                    color: button.color,
                    label: button.label,
                    value: sequence.declineButton?.value ?? "decline_upsell",
                  },
                })
              }
            />
          ) : null}
        </div>

        <ExclusivePlansEditor
          destinations={destinations}
          flowId={flowId}
          plans={exclusivePlans}
          onAdd={() =>
            onChange({
              ...sequence,
              exclusivePlans: [...exclusivePlans, createExclusivePlan()],
            })
          }
          onChange={updateExclusivePlan}
          onRemove={(planId) =>
            onChange({
              ...sequence,
              exclusivePlans: exclusivePlans.filter((plan) => plan.id !== planId),
            })
          }
        />

        <section className="grid gap-3">
          <h3 className="text-sm font-semibold text-foreground">Order Bump</h3>
          <select
            value={sequence.orderBumpMode ?? "none"}
            onChange={(event) =>
              onChange({
                ...sequence,
                orderBumpMode: event.target.value as FlowUpsellSequence["orderBumpMode"],
                orderBump:
                  event.target.value === "exclusive"
                    ? sequence.orderBump ?? createOrderBump()
                    : sequence.orderBump,
              })
            }
            className="h-10 rounded-md border border-white/10 bg-black/30 px-3 text-sm text-foreground outline-none"
          >
            <option value="none">Sem Order Bump</option>
            <option value="global">Utilizar Order Bump Global</option>
            <option value="exclusive">Criar Order Bump exclusivo</option>
          </select>
          {sequence.orderBumpMode === "exclusive" && sequence.orderBump ? (
            <OrderBumpOfferCard
              bumpId={`${sequence.id}-upsell-bump`}
              destinations={destinations}
              flowId={flowId}
              offer={sequence.orderBump}
              title="Order Bump Exclusivo"
              onChange={(orderBump) => onChange({ ...sequence, orderBump })}
            />
          ) : null}
        </section>
      </div>
    </CollapsibleCard>
  );
}

function Field({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
