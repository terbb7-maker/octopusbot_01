"use client";

import { Plus } from "lucide-react";

import { OfferSequenceCard } from "@/components/flows/editor/offer-sequence-card";
import { usePreviewState } from "@/components/flows/editor/preview-state";
import { Button } from "@/components/ui/button";
import type { BasicFlowEditorData, FlowUpsellSequence } from "@/server/services/flows";

type UpsellsSectionProps = {
  flow: BasicFlowEditorData;
};

function createUpsell(): FlowUpsellSequence {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now());

  return {
    id,
    delayValue: 0,
    delayUnit: "minutes",
    delayMinutes: 0,
    message: "",
    image: null,
    media: { type: "image", groupImages: false, images: [] },
    button: {
      color: "auto",
      label: "✅ Quero aproveitar",
      value: "view_upsell",
    },
    declineButton: {
      color: "auto",
      label: "❌ Não quero",
      value: "decline_upsell",
    },
    required: false,
    planId: "",
    exclusivePlans: [],
    deliveryType: "exclusive_plans",
    deliveryConfig: {},
    deliveryId: "",
    orderBumpMode: "none",
    orderBump: null,
  };
}

export function UpsellsSection({ flow }: UpsellsSectionProps) {
  const { setUpsells, upsells } = usePreviewState();

  function updateUpsell(sequence: FlowUpsellSequence) {
    setUpsells(upsells.map((item) => (item.id === sequence.id ? sequence : item)));
  }

  function duplicateUpsell(sequence: FlowUpsellSequence) {
    const copy = {
      ...sequence,
      id: crypto.randomUUID(),
      exclusivePlans: sequence.exclusivePlans.map((plan) => ({
        ...plan,
        id: crypto.randomUUID(),
      })),
      orderBump: sequence.orderBump
        ? { ...sequence.orderBump }
        : sequence.orderBump,
    };
    const index = upsells.findIndex((item) => item.id === sequence.id);

    setUpsells([
      ...upsells.slice(0, index + 1),
      copy,
      ...upsells.slice(index + 1),
    ]);
  }

  return (
    <div>
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-normal text-primary">
              Editor Basico
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-foreground">
              Upsell
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Crie ate 5 sequencias de upsell com delay, mensagem, imagem,
              botao, plano e entrega vinculada.
            </p>
          </div>
          <Button
            type="button"
            disabled={upsells.length >= 5}
            onClick={() => setUpsells([...upsells, createUpsell()])}
          >
            <Plus className="size-4" aria-hidden="true" />
            Adicionar sequencia ({upsells.length}/5)
          </Button>
        </div>

        <div className="mt-6 grid gap-4">
          {upsells.length ? (
            upsells.map((upsell, index) => (
              <OfferSequenceCard
                key={upsell.id}
                destinations={flow.telegramDeliveryDestinations}
                flowId={flow.id}
                index={index}
                onChange={updateUpsell}
                onDuplicate={() => duplicateUpsell(upsell)}
                onRemove={() =>
                  setUpsells(upsells.filter((item) => item.id !== upsell.id))
                }
                sequence={upsell}
              />
            ))
          ) : (
            <div className="rounded-md border border-dashed border-white/15 bg-black/20 p-6 text-sm leading-6 text-muted-foreground">
              Nenhuma sequencia criada. Adicione um upsell para continuar a
              venda apos a primeira oferta.
            </div>
          )}
        </div>

        <div className="mt-5 border-t border-white/10 pt-4 text-xs text-muted-foreground">
          Edite os upsells e use Salvar tudo para persistir.
        </div>
      </div>
    </div>
  );
}
