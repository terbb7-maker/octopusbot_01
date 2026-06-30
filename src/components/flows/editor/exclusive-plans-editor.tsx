"use client";

import { useState } from "react";
import { ImagePlus, Plus } from "lucide-react";

import {
  ButtonColorPicker,
  buttonColorHex,
} from "@/components/flows/editor/button-color-picker";
import { DeliverySelector } from "@/components/flows/editor/delivery-selector";
import { centsToInput, inputToCents } from "@/components/flows/editor/plan-formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { uploadFlowPlanImageAction } from "@/server/actions/flows";
import type { FlowPlan, TelegramDeliveryDestination } from "@/server/services/flows";

type ExclusivePlansEditorProps = {
  destinations: TelegramDeliveryDestination[];
  flowId: string;
  plans: FlowPlan[];
  onAdd: () => void;
  onChange: (plan: FlowPlan) => void;
  onRemove: (planId: string) => void;
};

export function ExclusivePlansEditor({
  destinations,
  flowId,
  onAdd,
  onChange,
  onRemove,
  plans,
}: ExclusivePlansEditorProps) {
  const [uploadingPlanId, setUploadingPlanId] = useState<string | null>(null);

  async function uploadImage(plan: FlowPlan, file: File) {
    setUploadingPlanId(plan.id);
    const formData = new FormData();
    formData.set("flowId", flowId);
    formData.set("planId", plan.id);
    formData.set("file", file);

    const result = await uploadFlowPlanImageAction(formData);

    if (result.ok && "image" in result) {
      onChange({ ...plan, image: result.image });
    }

    setUploadingPlanId(null);
  }

  return (
    <section className="grid gap-3 rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Plano(s) exclusivo(s)
          </h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Aparecem apenas dentro deste Upsell.
          </p>
        </div>
        <Button type="button" variant="outline" className="border-white/10" onClick={onAdd}>
          <Plus className="size-4" aria-hidden="true" />
        </Button>
      </div>
      <div className="grid gap-3">
        {plans.map((plan) => (
          <div key={plan.id} className="grid gap-3 rounded-md border border-white/10 p-3">
            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Nome">
                <Input
                  value={plan.name}
                  onChange={(event) => onChange({ ...plan, name: event.target.value })}
                />
              </Field>
              <Field label="Preço">
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={centsToInput(plan.priceCents)}
                  onChange={(event) =>
                    onChange({ ...plan, priceCents: inputToCents(event.target.value) })
                  }
                />
              </Field>
              <Field label="Descrição">
                <Input
                  value={plan.description ?? ""}
                  onChange={(event) =>
                    onChange({ ...plan, description: event.target.value })
                  }
                />
              </Field>
            </div>

            <ButtonColorPicker
              value={plan.buttonColor}
              onChange={(buttonColor) =>
                onChange({
                  ...plan,
                  buttonColor,
                  color: buttonColorHex(buttonColor),
                })
              }
            />

            <label className="flex cursor-pointer items-center gap-3 rounded-md border border-white/10 bg-white/[0.035] p-3 text-sm text-muted-foreground">
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) uploadImage(plan, file);
                  event.target.value = "";
                }}
              />
              <ImagePlus className="size-4 text-primary" aria-hidden="true" />
              <span className="truncate">
                {uploadingPlanId === plan.id
                  ? "Enviando imagem..."
                  : plan.image?.name ?? "Adicionar imagem do plano exclusivo"}
              </span>
            </label>

            <DeliverySelector
              allowDefault={false}
              config={plan.deliveryConfig}
              destinations={destinations}
              type={plan.deliveryType === "default" ? "custom_message" : plan.deliveryType}
              onChange={(deliveryType, deliveryConfig) =>
                onChange({
                  ...plan,
                  deliveryConfig,
                  deliveryType,
                  useDefaultDelivery: false,
                })
              }
            />

            <label className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.035] p-3 text-sm">
              <span>
                <span className="block font-medium text-foreground">
                  Order Bump proprio
                </span>
                <span className="text-xs text-muted-foreground">
                  Quando ativo, este plano nao utiliza o Order Bump global.
                </span>
              </span>
              <input
                type="checkbox"
                checked={!plan.useGlobalOrderBump}
                onChange={(event) =>
                  onChange({
                    ...plan,
                    orderBump: {
                      ...plan.orderBump,
                      enabled: event.target.checked,
                    },
                    useGlobalOrderBump: !event.target.checked,
                  })
                }
              />
            </label>

            <Button
              type="button"
              variant="outline"
              className="w-fit border-white/10 text-destructive"
              onClick={() => onRemove(plan.id)}
            >
              Remover plano exclusivo
            </Button>
          </div>
        ))}
      </div>
    </section>
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
