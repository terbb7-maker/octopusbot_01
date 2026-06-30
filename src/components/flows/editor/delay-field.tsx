"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type DelayFieldProps = {
  unit: "seconds" | "minutes";
  value: number;
  onChange: (delay: { unit: "seconds" | "minutes"; value: number }) => void;
};

export function DelayField({ onChange, unit, value }: DelayFieldProps) {
  return (
    <section className="grid gap-3 rounded-lg border border-white/10 bg-black/20 p-4">
      <h3 className="text-sm font-semibold text-foreground">Delay</h3>
      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
        <div className="grid gap-2">
          <Label>Valor</Label>
          <Input
            type="number"
            min="0"
            value={value}
            onChange={(event) =>
              onChange({ unit, value: Math.max(0, Number(event.target.value) || 0) })
            }
          />
        </div>
        <div className="grid gap-2">
          <Label>Unidade</Label>
          <select
            value={unit}
            onChange={(event) =>
              onChange({
                unit: event.target.value as "seconds" | "minutes",
                value,
              })
            }
            className="h-10 rounded-md border border-white/10 bg-black/30 px-3 text-sm text-foreground outline-none"
          >
            <option value="seconds">Segundos</option>
            <option value="minutes">Minutos</option>
          </select>
        </div>
      </div>
    </section>
  );
}
