"use client";

import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FlowOrderBumpButton } from "@/server/services/flows";

type OrderBumpButtonsFieldProps = {
  buttons: FlowOrderBumpButton[];
  onChange: (buttons: FlowOrderBumpButton[]) => void;
};

function createButton(): FlowOrderBumpButton {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : String(Date.now());

  return {
    id,
    label: "Adicionar",
    value: "accept_order_bump",
  };
}

export function OrderBumpButtonsField({
  buttons,
  onChange,
}: OrderBumpButtonsFieldProps) {
  function updateButton(button: FlowOrderBumpButton) {
    onChange(buttons.map((item) => (item.id === button.id ? button : item)));
  }

  return (
    <div className="rounded-md border border-white/10 bg-white/[0.025] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <Label>Botoes</Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="border-white/10"
          disabled={buttons.length >= 3}
          onClick={() => onChange([...buttons, createButton()])}
        >
          <Plus className="size-4" aria-hidden="true" />
          Adicionar
        </Button>
      </div>
      <div className="grid gap-3">
        {buttons.map((button) => (
          <div key={button.id} className="grid gap-2 md:grid-cols-[1fr_1fr_auto]">
            <Input
              value={button.label}
              maxLength={40}
              onChange={(event) =>
                updateButton({ ...button, label: event.target.value })
              }
              placeholder="Texto do botao"
            />
            <Input
              value={button.value}
              maxLength={120}
              onChange={(event) =>
                updateButton({ ...button, value: event.target.value })
              }
              placeholder="Acao"
            />
            <Button
              type="button"
              variant="outline"
              className="border-white/10 text-destructive"
              onClick={() =>
                onChange(buttons.filter((item) => item.id !== button.id))
              }
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
