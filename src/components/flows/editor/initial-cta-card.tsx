"use client";

import { MessageSquareText } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  FlowInitialConfig,
  FlowInitialCta,
  FlowInitialCtaAction,
} from "@/server/services/flows";

type InitialCtaCardProps = {
  config: FlowInitialConfig;
  onChange: (config: FlowInitialConfig) => void;
};

const defaultCta: FlowInitialCta = {
  action: "show_plans",
  enabled: false,
  label: "Comecar Agora",
  message: "",
  url: "",
  value: "show_plans",
};

export function InitialCtaCard({ config, onChange }: InitialCtaCardProps) {
  const cta = { ...defaultCta, ...(config.cta ?? {}) };

  function patchCta(next: Partial<FlowInitialCta>) {
    onChange({
      ...config,
      cta: {
        ...cta,
        ...next,
      },
    });
  }

  return (
    <section className="grid gap-4 rounded-lg border border-white/10 bg-black/20 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">
            Ativar Botao CTA
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Exibir um botao antes dos planos de pagamento.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={cta.enabled}
            onChange={(event) => patchCta({ enabled: event.target.checked })}
          />
          {cta.enabled ? "Ligado" : "Desligado"}
        </label>
      </div>

      {cta.enabled ? (
        <div className="grid gap-4 rounded-md border border-white/10 bg-white/[0.035] p-4">
          <div className="flex items-center gap-2">
            <MessageSquareText className="size-4 text-primary" aria-hidden="true" />
            <h4 className="text-sm font-semibold text-foreground">
              Configuracao do CTA
            </h4>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Texto do botao">
              <Input
                value={cta.label}
                maxLength={40}
                onChange={(event) => patchCta({ label: event.target.value })}
                placeholder="Comecar Agora"
              />
            </Field>
            <Field label="Acao do botao">
              <select
                value={cta.action}
                onChange={(event) =>
                  patchCta({
                    action: event.target.value as FlowInitialCtaAction,
                    value: event.target.value,
                  })
                }
                className="h-10 rounded-md border border-white/10 bg-black/30 px-3 text-sm text-foreground outline-none"
              >
                <option value="show_plans">Mostrar Planos</option>
                <option value="open_link">Abrir Link</option>
                <option value="send_message">Enviar Mensagem</option>
              </select>
            </Field>
          </div>

          {cta.action === "open_link" ? (
            <Field label="URL">
              <Input
                value={cta.url ?? ""}
                onChange={(event) => patchCta({ url: event.target.value })}
                placeholder="https://..."
              />
            </Field>
          ) : null}

          {cta.action === "send_message" ? (
            <Field label="Mensagem enviada apos o clique">
              <Textarea
                value={cta.message ?? ""}
                onChange={(event) => patchCta({ message: event.target.value })}
                placeholder="Escreva a mensagem que sera enviada antes dos planos."
                className="min-h-32"
              />
            </Field>
          ) : null}
        </div>
      ) : null}
    </section>
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
