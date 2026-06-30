"use client";

import { Plus } from "lucide-react";

import { OfferSequenceCard } from "@/components/flows/editor/offer-sequence-card";
import { usePreviewState } from "@/components/flows/editor/preview-state";
import { Button } from "@/components/ui/button";
import type {
  BasicFlowEditorData,
  FlowDownsellSequence,
} from "@/server/services/flows";

type DownsellsSectionProps = {
  flow: BasicFlowEditorData;
};

function createDownsell(): FlowDownsellSequence {
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
      label: "Ver oferta",
      value: "view_downsell",
    },
    declineButton: {
      color: "auto",
      label: "❌ Não quero",
      value: "decline_downsell",
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

export function DownsellsSection({ flow }: DownsellsSectionProps) {
  const { downsells, setDownsells } = usePreviewState();

  function updateDownsell(sequence: FlowDownsellSequence) {
    setDownsells(
      downsells.map((item) => (item.id === sequence.id ? sequence : item)),
    );
  }

  function duplicateDownsell(sequence: FlowDownsellSequence) {
    const copy = {
      ...sequence,
      id: crypto.randomUUID(),
      exclusivePlans: sequence.exclusivePlans.map((plan) => ({
        ...plan,
        id: crypto.randomUUID(),
      })),
    };
    const index = downsells.findIndex((item) => item.id === sequence.id);

    setDownsells([
      ...downsells.slice(0, index + 1),
      copy,
      ...downsells.slice(index + 1),
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
              Downsell
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Crie ate 20 sequencias de downsell para recuperar vendas com
              ofertas alternativas, delay, imagem, botao, plano e entrega.
            </p>
          </div>
          <Button
            type="button"
            disabled={downsells.length >= 20}
            onClick={() => setDownsells([...downsells, createDownsell()])}
          >
            <Plus className="size-4" aria-hidden="true" />
            Adicionar sequencia ({downsells.length}/20)
          </Button>
        </div>

        <div className="mt-6 grid gap-4">
          {downsells.length ? (
            downsells.map((downsell, index) => (
              <OfferSequenceCard
                key={downsell.id}
                destinations={flow.telegramDeliveryDestinations}
                flowId={flow.id}
                index={index}
                onChange={updateDownsell}
                onDuplicate={() => duplicateDownsell(downsell)}
                onRemove={() =>
                  setDownsells(downsells.filter((item) => item.id !== downsell.id))
                }
                sequence={downsell}
              />
            ))
          ) : (
            <div className="rounded-md border border-dashed border-white/15 bg-black/20 p-6 text-sm leading-6 text-muted-foreground">
              Nenhuma sequencia criada. Adicione um downsell para oferecer uma
              alternativa quando o cliente nao comprar a oferta principal.
            </div>
          )}
        </div>

        <div className="mt-5 border-t border-white/10 pt-4 text-xs text-muted-foreground">
          Edite os downsells e use Salvar tudo para persistir.
        </div>
      </div>
    </div>
  );
}
