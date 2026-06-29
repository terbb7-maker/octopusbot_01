"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { OfferSequenceCard } from "@/components/flows/editor/offer-sequence-card";
import { usePreviewState } from "@/components/flows/editor/preview-state";
import { Button } from "@/components/ui/button";
import { uploadFlowDownsellImageAction } from "@/server/actions/flows";
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
    delayMinutes: 0,
    message: "",
    image: null,
    button: {
      label: "Ver oferta",
      value: "view_downsell",
    },
    planId: "",
    deliveryId: "",
  };
}

export function DownsellsSection({ flow }: DownsellsSectionProps) {
  const { deliveries, downsells, plans, setDownsells } = usePreviewState();
  const [uploadState, setUploadState] = useState("");

  function updateDownsell(sequence: FlowDownsellSequence) {
    setDownsells(
      downsells.map((item) => (item.id === sequence.id ? sequence : item)),
    );
  }

  async function uploadImage(downsellId: string, file: File) {
    setUploadState("Enviando imagem...");
    const formData = new FormData();
    formData.set("downsellId", downsellId);
    formData.set("file", file);
    formData.set("flowId", flow.id);

    const result = await uploadFlowDownsellImageAction(formData);

    if (!result.ok || !("image" in result) || !result.image) {
      setUploadState(result.message);
      return;
    }

    setDownsells(
      downsells.map((downsell) =>
        downsell.id === downsellId
          ? { ...downsell, image: result.image }
          : downsell,
      ),
    );
    setUploadState("Imagem pronta para salvar.");
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
                deliveries={deliveries}
                emptyTitle="Downsell automatizado"
                imageLabel="Adicionar imagem do downsell"
                index={index}
                messagePlaceholder="Escreva a mensagem enviada nesta etapa de downsell."
                onChange={updateDownsell}
                onImageUpload={(file) => uploadImage(downsell.id, file)}
                onRemove={() =>
                  setDownsells(downsells.filter((item) => item.id !== downsell.id))
                }
                plans={plans}
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
          {uploadState || "Edite os downsells e use Salvar tudo para persistir."}
        </div>
      </div>
    </div>
  );
}
