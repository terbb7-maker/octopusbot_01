"use client";

import { Check } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { FlowButtonColor } from "@/server/services/flows";

type ButtonConfigFieldProps = {
  color: FlowButtonColor;
  label: string;
  maxLength?: number;
  title: string;
  onChange: (value: { color: FlowButtonColor; label: string }) => void;
};

const colors: Array<{
  className: string;
  label: string;
  value: FlowButtonColor;
}> = [
  { className: "bg-primary", label: "Auto", value: "auto" },
  { className: "bg-sky-400", label: "Azul", value: "blue" },
  { className: "bg-emerald-400", label: "Verde", value: "green" },
  { className: "bg-red-500", label: "Vermelho", value: "red" },
];

export function flowButtonColorHex(value: FlowButtonColor) {
  const map = {
    auto: "#0ea5e9",
    blue: "#38bdf8",
    green: "#22c55e",
    red: "#ef4444",
  };

  return map[value];
}

export function ButtonConfigField({
  color,
  label,
  maxLength = 40,
  onChange,
  title,
}: ButtonConfigFieldProps) {
  return (
    <section className="grid gap-3 rounded-lg border border-white/10 bg-black/20 p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Texto e cor ficam salvos para Telegram e futuras integrações.
        </p>
      </div>
      <div className="grid gap-2">
        <Label>Texto do botão</Label>
        <Input
          value={label}
          maxLength={maxLength}
          onChange={(event) => onChange({ color, label: event.target.value })}
        />
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        {colors.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onChange({ color: item.value, label })}
            className={cn(
              "flex items-center gap-2 rounded-md border border-white/10 bg-black/30 p-3 text-left text-sm transition-colors hover:bg-white/[0.04]",
              color === item.value && "border-primary/60",
            )}
          >
            <span className={cn("grid size-5 place-items-center rounded-full", item.className)}>
              {color === item.value ? (
                <Check className="size-3 text-white" aria-hidden="true" />
              ) : null}
            </span>
            {item.label}
          </button>
        ))}
      </div>
      <div
        className="w-fit rounded-md px-4 py-2 text-sm font-semibold text-white"
        style={{ backgroundColor: flowButtonColorHex(color) }}
      >
        {label || "Botão"}
      </div>
    </section>
  );
}
