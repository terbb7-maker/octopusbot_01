"use client";

import { useRef } from "react";

import { RichTextEditor } from "@/components/flows/editor/rich-text-editor";
import { VariablePicker } from "@/components/flows/editor/variable-picker";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  FlowPlanDeliveryConfig,
  FlowPlanDeliveryType,
  TelegramDeliveryDestination,
} from "@/server/services/flows";

type DeliveryConfigFieldProps = {
  config: FlowPlanDeliveryConfig;
  destinations: TelegramDeliveryDestination[];
  title?: string;
  type: FlowPlanDeliveryType;
  onChange: (type: FlowPlanDeliveryType, config: FlowPlanDeliveryConfig) => void;
};

function typeForDestination(destination?: TelegramDeliveryDestination) {
  if (!destination) return "telegram_group";

  return destination.chatType === "channel" ? "telegram_channel" : "telegram_group";
}

export function DeliveryConfigField({
  config,
  destinations,
  onChange,
  title = "Destino da entrega",
  type,
}: DeliveryConfigFieldProps) {
  const editorRef = useRef<HTMLTextAreaElement | null>(null);
  const telegramDestinations = destinations.filter((destination) =>
    ["group", "supergroup", "channel"].includes(destination.chatType),
  );

  function updateMessage(message: string) {
    onChange(type, {
      ...config,
      message,
    });
  }

  function insertVariable(variable: string) {
    const textarea = editorRef.current;
    const value = textarea?.value ?? config.message ?? "";
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    const next = `${value.slice(0, start)}${variable}${value.slice(end)}`;

    updateMessage(next);
    window.requestAnimationFrame(() => {
      editorRef.current?.focus();
      const cursor = start + variable.length;
      editorRef.current?.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <section className="grid gap-4 rounded-lg border border-white/10 bg-black/20 p-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Configure como o acesso será entregue após o pagamento.
        </p>
      </div>

      <div className="grid gap-2">
        <Label>Destino</Label>
        <select
          value={type}
          onChange={(event) =>
            onChange(event.target.value as FlowPlanDeliveryType, {})
          }
          className="h-10 rounded-md border border-white/10 bg-black/30 px-3 text-sm text-foreground outline-none"
        >
          <option value="default">Usar entrega padrão do fluxo</option>
          <option value="telegram_group">Grupo / Canal Telegram</option>
          <option value="link">Link</option>
          <option value="custom_message">Mensagem de texto</option>
        </select>
      </div>

      {type === "telegram_group" || type === "telegram_channel" ? (
        <div className="grid gap-2">
          <Label>Grupo ou canal</Label>
          <select
            value={config.telegramDestinationId ?? ""}
            onChange={(event) => {
              const destination = telegramDestinations.find(
                (item) => item.id === event.target.value,
              );

              onChange(typeForDestination(destination), {
                telegramChatId: destination?.chatExternalId,
                telegramChatTitle: destination?.title,
                telegramChatType: destination?.chatType,
                telegramDestinationId: destination?.id ?? "",
              });
            }}
            className="h-10 rounded-md border border-white/10 bg-black/30 px-3 text-sm text-foreground outline-none"
          >
            <option value="">Selecione um destino encontrado</option>
            {telegramDestinations.map((destination) => (
              <option key={destination.id} value={destination.id}>
                {destination.title} - {destination.botName}
              </option>
            ))}
          </select>
          {!telegramDestinations.length ? (
            <p className="text-xs text-muted-foreground">
              Nenhum grupo ou canal administrado pelos bots vinculados foi encontrado.
            </p>
          ) : null}
        </div>
      ) : null}

      {type === "link" ? (
        <div className="grid gap-2">
          <Label>URL</Label>
          <Input
            value={config.linkUrl ?? ""}
            onChange={(event) =>
              onChange(type, { ...config, linkUrl: event.target.value })
            }
            placeholder="https://..."
          />
        </div>
      ) : null}

      {type === "custom_message" ? (
        <div className="grid gap-3">
          <RichTextEditor
            editorRef={editorRef}
            html={config.message ?? ""}
            value={config.message ?? ""}
            onChange={(value) => updateMessage(value)}
          />
          <VariablePicker onInsert={insertVariable} />
        </div>
      ) : null}
    </section>
  );
}
