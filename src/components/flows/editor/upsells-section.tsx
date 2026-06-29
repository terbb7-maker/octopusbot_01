"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { OfferSequenceCard } from "@/components/flows/editor/offer-sequence-card";
import { usePreviewState } from "@/components/flows/editor/preview-state";
import { Button } from "@/components/ui/button";
import { uploadFlowUpsellImageAction } from "@/server/actions/flows";
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
    delayMinutes: 0,
    message: "",
    image: null,
    button: {
      label: "Ver oferta",
      value: "view_upsell",
    },
    planId: "",
    deliveryId: "",
  };
}

export function UpsellsSection({ flow }: UpsellsSectionProps) {
  const { deliveries, plans, setUpsells, upsells } = usePreviewState();
  const [uploadState, setUploadState] = useState("");

  function updateUpsell(sequence: FlowUpsellSequence) {
    setUpsells(upsells.map((item) => (item.id === sequence.id ? sequence : item)));
  }

  async function uploadImage(upsellId: string, file: File) {
    setUploadState("Enviando imagem...");
    const formData = new FormData();
    formData.set("flowId", flow.id);
    formData.set("upsellId", upsellId);
    formData.set("file", file);

    const result = await uploadFlowUpsellImageAction(formData);

    if (!result.ok || !("image" in result) || !result.image) {
      setUploadState(result.message);
      return;
    }

    setUpsells(
      upsells.map((upsell) =>
        upsell.id === upsellId ? { ...upsell, image: result.image } : upsell,
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
                deliveries={deliveries}
                emptyTitle="Upsell automatizado"
                imageLabel="Adicionar imagem do upsell"
                index={index}
                messagePlaceholder="Escreva a mensagem enviada nesta etapa de upsell."
                onChange={updateUpsell}
                onImageUpload={(file) => uploadImage(upsell.id, file)}
                onRemove={() =>
                  setUpsells(upsells.filter((item) => item.id !== upsell.id))
                }
                plans={plans}
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
          {uploadState || "Edite os upsells e use Salvar tudo para persistir."}
        </div>
      </div>
    </div>
  );
}
