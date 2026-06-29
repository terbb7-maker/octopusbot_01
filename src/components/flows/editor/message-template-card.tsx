"use client";

import { ImagePlus, Plus, Trash2 } from "lucide-react";
import { useState } from "react";

import { OrderBumpButtonsField } from "@/components/flows/editor/order-bump-buttons-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { FlowMessageTemplate } from "@/server/services/flows";

type MessageTemplateCardProps = {
  description: string;
  onChange: (template: FlowMessageTemplate) => void;
  onMediaUpload: (file: File) => void;
  template: FlowMessageTemplate;
  title: string;
};

export function MessageTemplateCard({
  description,
  onChange,
  onMediaUpload,
  template,
  title,
}: MessageTemplateCardProps) {
  const [variable, setVariable] = useState("");

  function addVariable() {
    const nextVariable = variable.trim();

    if (!nextVariable || template.variables.includes(nextVariable)) return;

    onChange({
      ...template,
      variables: [...template.variables, nextVariable].slice(0, 20),
    });
    setVariable("");
  }

  return (
    <article className="rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="mb-4">
        <p className="text-xs font-medium uppercase tracking-normal text-primary">
          {title}
        </p>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="grid gap-4">
        <Field label="Texto">
          <Textarea
            value={template.text}
            maxLength={1600}
            onChange={(event) =>
              onChange({ ...template, text: event.target.value })
            }
            placeholder="Escreva a mensagem enviada ao cliente."
          />
        </Field>

        <div className="grid gap-2">
          <Label>Midias</Label>
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-white/10 bg-white/[0.035] p-3 text-sm text-muted-foreground">
            <input
              type="file"
              accept="image/*,video/*,audio/*"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onMediaUpload(file);
              }}
            />
            <ImagePlus className="size-4 text-primary" aria-hidden="true" />
            <span>Adicionar midia ({template.media.length}/5)</span>
          </label>
          {template.media.length ? (
            <div className="grid gap-2">
              {template.media.map((media) => (
                <div
                  key={media.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-white/[0.025] px-3 py-2 text-sm text-muted-foreground"
                >
                  <span className="truncate">{media.name}</span>
                  <Button
                    type="button"
                    variant="outline"
                    className="border-white/10 text-destructive"
                    onClick={() =>
                      onChange({
                        ...template,
                        media: template.media.filter((item) => item.id !== media.id),
                      })
                    }
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <OrderBumpButtonsField
          buttons={template.buttons}
          onChange={(buttons) => onChange({ ...template, buttons })}
        />

        <div className="grid gap-2">
          <Label>Variaveis</Label>
          <div className="grid gap-2 md:grid-cols-[1fr_auto]">
            <Input
              value={variable}
              maxLength={40}
              onChange={(event) => setVariable(event.target.value)}
              placeholder="Ex: nome_cliente"
            />
            <Button type="button" variant="outline" onClick={addVariable}>
              <Plus className="size-4" aria-hidden="true" />
              Adicionar
            </Button>
          </div>
          {template.variables.length ? (
            <div className="flex flex-wrap gap-2">
              {template.variables.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="rounded-md border border-white/10 bg-white/[0.04] px-3 py-1 text-xs text-muted-foreground"
                  onClick={() =>
                    onChange({
                      ...template,
                      variables: template.variables.filter(
                        (current) => current !== item,
                      ),
                    })
                  }
                >
                  {`{{${item}}}`}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function Field({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
