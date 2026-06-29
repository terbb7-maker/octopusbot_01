"use client";

import { Button } from "@/components/ui/button";

export const editorVariables = [
  { label: "Nome do Lead", value: "{{lead.name}}" },
  { label: "Email", value: "{{lead.email}}" },
  { label: "Telefone", value: "{{lead.phone}}" },
  { label: "Cidade", value: "{{lead.city}}" },
  { label: "Estado", value: "{{lead.state}}" },
  { label: "Nome do Bot", value: "{{bot.name}}" },
  { label: "Username do Bot", value: "{{bot.username}}" },
];

export function extractVariables(text: string) {
  return Array.from(text.matchAll(/\{\{([^}]+)\}\}/g))
    .map((match) => match[1]?.trim())
    .filter((item): item is string => Boolean(item));
}

export function VariablePicker({
  onInsert,
}: {
  onInsert: (variable: string) => void;
}) {
  return (
    <section className="grid gap-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">
          Variaveis disponiveis
        </h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Clique para inserir
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {editorVariables.map((variable) => (
          <Button
            key={variable.value}
            type="button"
            variant="outline"
            size="sm"
            className="border-white/10 bg-black/20"
            onClick={() => onInsert(variable.value)}
          >
            {variable.label}
          </Button>
        ))}
      </div>
    </section>
  );
}
