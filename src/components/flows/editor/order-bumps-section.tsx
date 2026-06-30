"use client";

import { Plus } from "lucide-react";

import { OrderBumpOfferCard } from "@/components/flows/editor/order-bump-offer-card";
import { usePreviewState } from "@/components/flows/editor/preview-state";
import { Button } from "@/components/ui/button";
import type {
  BasicFlowEditorData,
  FlowOrderBumpIndividual,
  FlowOrderBumpOffer,
} from "@/server/services/flows";

type OrderBumpsSectionProps = {
  flow: BasicFlowEditorData;
};

function blankOffer(): FlowOrderBumpOffer {
  return {
    enabled: false,
    title: "",
    priceCents: 0,
    message: "",
    image: null,
    media: { type: "image", groupImages: false, images: [] },
    acceptButtonText: "✅ Quero aproveitar",
    acceptButtonColor: "auto",
    declineButtonText: "❌ Continuar sem bônus",
    declineButtonColor: "auto",
    buttons: [],
    deliveryId: "",
    deliveryType: "default",
    deliveryConfig: {},
  };
}

function createIndividual(planId = ""): FlowOrderBumpIndividual {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now());

  return {
    ...blankOffer(),
    id,
    planId,
    title: "Oferta adicional",
  };
}

export function OrderBumpsSection({ flow }: OrderBumpsSectionProps) {
  const { orderBumps, plans, setOrderBumps } = usePreviewState();

  function updateIndividual(offer: FlowOrderBumpIndividual) {
    setOrderBumps({
      ...orderBumps,
      individual: orderBumps.individual.map((item) =>
        item.id === offer.id ? offer : item,
      ),
    });
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
              Order Bump
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Configure ofertas complementares globais ou especificas por plano,
              com mensagem, imagem, botoes e entrega vinculada.
            </p>
          </div>
          <Button
            type="button"
            disabled={
              !plans.length || orderBumps.individual.length >= plans.length
            }
            onClick={() =>
              setOrderBumps({
                ...orderBumps,
                individual: [
                  ...orderBumps.individual,
                  createIndividual(plans[0]?.id ?? ""),
                ],
              })
            }
          >
            <Plus className="size-4" aria-hidden="true" />
            Order bump individual
          </Button>
        </div>

        <div className="mt-6 grid gap-4">
          <OrderBumpOfferCard
            bumpId="global"
            destinations={flow.telegramDeliveryDestinations}
            flowId={flow.id}
            offer={orderBumps.global}
            title="Order Bump Global"
            onChange={(global) =>
              setOrderBumps({ ...orderBumps, global })
            }
          />

          {orderBumps.individual.map((offer) => (
            <OrderBumpOfferCard
              key={offer.id}
              bumpId={offer.id}
              destinations={flow.telegramDeliveryDestinations}
              flowId={flow.id}
              offer={offer}
              planId={offer.planId}
              plans={plans}
              title="Order Bump Individual"
              onChange={(nextOffer) => updateIndividual({ ...offer, ...nextOffer })}
              onPlanChange={(planId) => updateIndividual({ ...offer, planId })}
              onRemove={() =>
                setOrderBumps({
                  ...orderBumps,
                  individual: orderBumps.individual.filter(
                    (item) => item.id !== offer.id,
                  ),
                })
              }
            />
          ))}
        </div>

        <div className="mt-5 border-t border-white/10 pt-4 text-xs text-muted-foreground">
          Edite os order bumps e use Salvar tudo para persistir.
        </div>
      </div>
    </div>
  );
}
