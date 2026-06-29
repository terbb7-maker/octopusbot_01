"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { DeliveryFormCard } from "@/components/flows/editor/delivery-form-card";
import { usePreviewState } from "@/components/flows/editor/preview-state";
import { Button } from "@/components/ui/button";
import { uploadFlowDeliveryFileAction } from "@/server/actions/flows";
import type { BasicFlowEditorData, FlowDelivery } from "@/server/services/flows";

type DeliveriesSectionProps = {
  flow: BasicFlowEditorData;
};

function createDelivery(): FlowDelivery {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now());

  return {
    id,
    type: "custom_message",
    name: "Nova entrega",
    message: "",
  };
}

export function DeliveriesSection({ flow }: DeliveriesSectionProps) {
  const { deliveries, setDeliveries } = usePreviewState();
  const [uploadState, setUploadState] = useState("");

  function updateDelivery(delivery: FlowDelivery) {
    setDeliveries(
      deliveries.map((currentDelivery) =>
        currentDelivery.id === delivery.id ? delivery : currentDelivery,
      ),
    );
  }

  async function uploadFile(deliveryId: string, file: File) {
    setUploadState("Enviando arquivo...");
    const formData = new FormData();
    formData.set("flowId", flow.id);
    formData.set("deliveryId", deliveryId);
    formData.set("file", file);

    const result = await uploadFlowDeliveryFileAction(formData);

    if (!result.ok || !("file" in result) || !result.file) {
      setUploadState(result.message);
      return;
    }

    setDeliveries(
      deliveries.map((delivery) =>
        delivery.id === deliveryId ? { ...delivery, file: result.file } : delivery,
      ),
    );
    setUploadState("Arquivo pronto para salvar.");
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
              Entregas
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Configure o conteudo liberado apos a venda: grupos, canais,
              links, arquivos ou mensagens personalizadas.
            </p>
          </div>
          <Button
            type="button"
            disabled={deliveries.length >= 20}
            onClick={() => setDeliveries([...deliveries, createDelivery()])}
          >
            <Plus className="size-4" aria-hidden="true" />
            Adicionar entrega ({deliveries.length}/20)
          </Button>
        </div>

        <div className="mt-6 grid gap-4">
          {deliveries.length ? (
            deliveries.map((delivery, index) => (
              <DeliveryFormCard
                key={delivery.id}
                delivery={delivery}
                destinations={flow.telegramDeliveryDestinations}
                index={index}
                onChange={updateDelivery}
                onRemove={() =>
                  setDeliveries(deliveries.filter((item) => item.id !== delivery.id))
                }
                onFileUpload={(file) => uploadFile(delivery.id, file)}
              />
            ))
          ) : (
            <div className="rounded-md border border-dashed border-white/15 bg-black/20 p-6 text-sm leading-6 text-muted-foreground">
              Nenhuma entrega criada. Adicione uma entrega para definir o que o
              cliente recebe automaticamente.
            </div>
          )}
        </div>

        <div className="mt-5 border-t border-white/10 pt-4 text-xs text-muted-foreground">
          {uploadState || "Edite as entregas e use Salvar tudo para persistir."}
        </div>
      </div>
    </div>
  );
}
