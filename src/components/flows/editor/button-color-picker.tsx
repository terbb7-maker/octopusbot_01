import { Check } from "lucide-react";

import { cn } from "@/lib/utils";
import type { FlowPlanButtonColor } from "@/server/services/flows";

type ButtonColorPickerProps = {
  value: FlowPlanButtonColor;
  onChange: (value: FlowPlanButtonColor) => void;
};

const colors: Array<{
  label: string;
  value: FlowPlanButtonColor;
  className: string;
}> = [
  { label: "Padrao", value: "default", className: "bg-primary" },
  { label: "Azul", value: "blue", className: "bg-sky-400" },
  { label: "Verde", value: "green", className: "bg-emerald-400" },
  { label: "Vermelho", value: "red", className: "bg-red-500" },
];

export function buttonColorHex(value: FlowPlanButtonColor) {
  const map = {
    blue: "#38bdf8",
    default: "#a855f7",
    green: "#22c55e",
    red: "#ef4444",
  };

  return map[value];
}

export function ButtonColorPicker({ onChange, value }: ButtonColorPickerProps) {
  return (
    <section className="grid gap-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Cor do botao</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Cor exibida no Telegram.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-4">
        {colors.map((color) => (
          <button
            key={color.value}
            type="button"
            onClick={() => onChange(color.value)}
            className={cn(
              "flex items-center gap-2 rounded-md border border-white/10 bg-black/20 p-3 text-left text-sm transition-colors hover:bg-white/[0.04]",
              value === color.value && "border-primary/60",
            )}
          >
            <span className={cn("grid size-5 place-items-center rounded-full", color.className)}>
              {value === color.value ? (
                <Check className="size-3 text-white" aria-hidden="true" />
              ) : null}
            </span>
            {color.label}
          </button>
        ))}
      </div>
      <div
        className="w-fit rounded-md px-4 py-2 text-sm font-semibold text-white"
        style={{ backgroundColor: buttonColorHex(value) }}
      >
        Preview do botao
      </div>
    </section>
  );
}
