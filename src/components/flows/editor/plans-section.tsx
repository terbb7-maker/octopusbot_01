"use client";

import { useMemo, useState } from "react";
import { Plus } from "lucide-react";

import { DefaultDeliveryCard } from "@/components/flows/editor/default-delivery-card";
import { buttonColorHex } from "@/components/flows/editor/button-color-picker";
import { PlanEditor } from "@/components/flows/editor/plan-editor";
import { PlanList } from "@/components/flows/editor/plan-list";
import { PlanVariation } from "@/components/flows/editor/plan-variation";
import { usePreviewState } from "@/components/flows/editor/preview-state";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  alertDialogActionClassName,
  alertDialogCancelClassName,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadFlowPlanImageAction } from "@/server/actions/flows";
import type { BasicFlowEditorData, FlowPlan } from "@/server/services/flows";

type PlansSectionProps = {
  flow: BasicFlowEditorData;
};

const emptyStats = {
  conversionRate: 0,
  leads: 0,
  pixGenerated: 0,
  pixPaid: 0,
  revenueCents: 0,
};

function createPlan(order: number): FlowPlan {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now());

  return {
    active: true,
    billingType: "lifetime",
    buttonColor: "default",
    buttonLabel: "Selecionar",
    buttonValue: "select_plan",
    color: buttonColorHex("default"),
    deliveryConfig: {},
    deliveryType: "default",
    description: "",
    id,
    image: null,
    name: "",
    order,
    orderBump: {
      enabled: false,
      name: "",
      description: "",
      priceCents: 0,
    },
    orderBumpId: null,
    priceCents: 0,
    stats: emptyStats,
    useDefaultDelivery: true,
    useGlobalOrderBump: true,
  };
}

export function PlansSection({ flow }: PlansSectionProps) {
  const {
    planDefaultDelivery,
    planMessage,
    planPriceVariation,
    plans,
    setPlanDefaultDelivery,
    setPlanMessage,
    setPlanPriceVariation,
    setPlans,
  } = usePreviewState();
  const [activePlanId, setActivePlanId] = useState(plans[0]?.id ?? null);
  const [uploadState, setUploadState] = useState("");
  const [planToRemove, setPlanToRemove] = useState<FlowPlan | null>(null);
  const activePlan = useMemo(
    () => plans.find((plan) => plan.id === activePlanId) ?? plans[0] ?? null,
    [activePlanId, plans],
  );

  function updatePlan(plan: FlowPlan) {
    setPlans(
      plans.map((currentPlan) =>
        currentPlan.id === plan.id ? plan : currentPlan,
      ),
    );
  }

  function addPlan() {
    const plan = createPlan(plans.length);

    setPlans([...plans, plan]);
    setActivePlanId(plan.id);
  }

  function removePlan() {
    if (!planToRemove) return;

    const nextPlans = plans.filter((plan) => plan.id !== planToRemove.id);

    setPlans(nextPlans.map((plan, index) => ({ ...plan, order: index })));
    setActivePlanId(nextPlans[0]?.id ?? null);
    setPlanToRemove(null);
  }

  async function uploadImage(planId: string, file: File) {
    setUploadState("Enviando imagem...");
    const formData = new FormData();
    formData.set("flowId", flow.id);
    formData.set("planId", planId);
    formData.set("file", file);

    const result = await uploadFlowPlanImageAction(formData);

    if (!result.ok || !("image" in result) || !result.image) {
      setUploadState(result.message);
      return;
    }

    setPlans(
      plans.map((plan) =>
        plan.id === planId ? { ...plan, image: result.image } : plan,
      ),
    );
    setUploadState("Imagem pronta para salvar.");
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-normal text-primary">
            Editor Basico
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-foreground">
            Planos de Pagamento
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Configure ate 10 planos de pagamento com entregas personalizadas.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Maximo de 10 planos por fluxo.
          </p>
        </div>
        <Button type="button" disabled={plans.length >= 10} onClick={addPlan}>
          <Plus className="size-4" aria-hidden="true" />
          Adicionar Plano
        </Button>
      </div>

      <div className="mt-6 grid gap-6">
        <div className="rounded-lg border border-white/10 bg-black/20 p-5">
          <div className="grid gap-2">
            <Label htmlFor="plan-message">Mensagem dos Planos</Label>
            <Textarea
              id="plan-message"
              value={planMessage}
              maxLength={500}
              rows={3}
              onChange={(event) => setPlanMessage(event.target.value)}
              placeholder="Escolha uma das opções abaixo:"
            />
            <p className="text-xs text-muted-foreground">
              Essa mensagem aparece no Telegram imediatamente acima dos botões
              individuais dos planos.
            </p>
          </div>
        </div>

        <PlanList
          activePlanId={activePlan?.id ?? null}
          plans={plans}
          onSelect={setActivePlanId}
        />

        {activePlan ? (
          <PlanEditor
            destinations={flow.telegramDeliveryDestinations}
            plan={activePlan}
            onChange={updatePlan}
            onImageUpload={(file) => uploadImage(activePlan.id, file)}
            onRemove={() => setPlanToRemove(activePlan)}
          />
        ) : null}

        <PlanVariation
          value={planPriceVariation}
          onChange={setPlanPriceVariation}
        />

        <DefaultDeliveryCard
          delivery={planDefaultDelivery}
          destinations={flow.telegramDeliveryDestinations}
          onChange={setPlanDefaultDelivery}
        />

        <div className="border-t border-white/10 pt-4 text-xs text-muted-foreground">
          {uploadState || "Nada e salvo automaticamente. Use Salvar tudo para persistir."}
        </div>
      </div>

      <AlertDialog open={Boolean(planToRemove)} onOpenChange={() => setPlanToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja realmente excluir este plano?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao nao podera ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={alertDialogCancelClassName}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className={alertDialogActionClassName}
              onClick={removePlan}
            >
              Excluir Plano
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
