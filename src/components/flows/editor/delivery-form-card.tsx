"use client";

import { FileUp, Link2, MessageSquareText, Send, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type {
  FlowDelivery,
  FlowDeliveryType,
  TelegramDeliveryDestination,
} from "@/server/services/flows";

type DeliveryFormCardProps = {
  delivery: FlowDelivery;
  destinations: TelegramDeliveryDestination[];
  index: number;
  onChange: (delivery: FlowDelivery) => void;
  onFileUpload: (file: File) => void;
  onRemove: () => void;
};

const deliveryTypes: Array<{ label: string; value: FlowDeliveryType }> = [
  { label: "Grupo Telegram", value: "telegram_group" },
  { label: "Canal Telegram", value: "telegram_channel" },
  { label: "Link", value: "link" },
  { label: "Arquivo", value: "file" },
  { label: "Mensagem personalizada", value: "custom_message" },
];

function typeLabel(type: FlowDeliveryType) {
  return deliveryTypes.find((item) => item.value === type)?.label ?? "Entrega";
}

function filteredDestinations(
  type: FlowDeliveryType,
  destinations: TelegramDeliveryDestination[],
) {
  if (type === "telegram_channel") {
    return destinations.filter((destination) => destination.chatType === "channel");
  }

  if (type === "telegram_group") {
    return destinations.filter((destination) =>
      ["group", "supergroup"].includes(destination.chatType),
    );
  }

  return [];
}

export function DeliveryFormCard({
  delivery,
  destinations,
  index,
  onChange,
  onFileUpload,
  onRemove,
}: DeliveryFormCardProps) {
  const telegramDestinations = filteredDestinations(delivery.type, destinations);
  const isTelegramDelivery =
    delivery.type === "telegram_group" || delivery.type === "telegram_channel";

  return (
    <article className="rounded-lg border border-white/10 bg-black/20 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-normal text-primary">
            Entrega {index + 1}
          </p>
          <h3 className="mt-1 text-base font-semibold text-foreground">
            {delivery.name || typeLabel(delivery.type)}
          </h3>
        </div>
        <Button
          type="button"
          variant="outline"
          className="border-white/10 text-destructive"
          onClick={onRemove}
        >
          <Trash2 className="size-4" aria-hidden="true" />
        </Button>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-3 md:grid-cols-2">
          <Field label="Nome">
            <Input
              value={delivery.name}
              maxLength={80}
              onChange={(event) =>
                onChange({ ...delivery, name: event.target.value })
              }
              placeholder="Ex: Acesso VIP"
            />
          </Field>
          <Field label="Tipo">
            <select
              value={delivery.type}
              onChange={(event) =>
                onChange({
                  ...delivery,
                  file: null,
                  linkUrl: "",
                  message: "",
                  telegramDestinationId: "",
                  type: event.target.value as FlowDeliveryType,
                })
              }
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {deliveryTypes.map((type) => (
                <option key={type.value} value={type.value} className="bg-background">
                  {type.label}
                </option>
              ))}
            </select>
          </Field>
        </div>

        {isTelegramDelivery ? (
          <Field label="Destino administrado pelo bot">
            <select
              value={delivery.telegramDestinationId ?? ""}
              onChange={(event) =>
                onChange({
                  ...delivery,
                  telegramDestinationId: event.target.value,
                })
              }
              className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="" className="bg-background">
                Selecionar destino
              </option>
              {telegramDestinations.map((destination) => (
                <option
                  key={destination.id}
                  value={destination.id}
                  className="bg-background"
                >
                  {destination.title} - {destination.botName}
                </option>
              ))}
            </select>
            {!telegramDestinations.length ? (
              <p className="text-xs leading-5 text-muted-foreground">
                Nenhum destino encontrado. Adicione o bot como administrador e
                envie uma mensagem no grupo ou canal para sincronizar.
              </p>
            ) : null}
          </Field>
        ) : null}

        {delivery.type === "link" ? (
          <Field label="URL de entrega">
            <Input
              value={delivery.linkUrl ?? ""}
              onChange={(event) =>
                onChange({ ...delivery, linkUrl: event.target.value })
              }
              placeholder="https://..."
            />
          </Field>
        ) : null}

        {delivery.type === "file" ? (
          <label className="flex cursor-pointer items-center gap-3 rounded-md border border-white/10 bg-white/[0.035] p-3 text-sm text-muted-foreground">
            <input
              type="file"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onFileUpload(file);
              }}
            />
            <FileUp className="size-4 text-primary" aria-hidden="true" />
            <span className="truncate">
              {delivery.file?.name ?? "Enviar arquivo da entrega"}
            </span>
          </label>
        ) : null}

        {delivery.type === "custom_message" ? (
          <Field label="Mensagem personalizada">
            <Textarea
              value={delivery.message ?? ""}
              maxLength={1200}
              onChange={(event) =>
                onChange({ ...delivery, message: event.target.value })
              }
              placeholder="Escreva a mensagem que sera entregue apos a compra."
            />
          </Field>
        ) : null}

        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.025] px-3 py-2 text-xs text-muted-foreground">
          {delivery.type === "link" ? <Link2 className="size-4" /> : null}
          {delivery.type === "custom_message" ? (
            <MessageSquareText className="size-4" />
          ) : null}
          {isTelegramDelivery ? <Send className="size-4" /> : null}
          {delivery.type === "file" ? <FileUp className="size-4" /> : null}
          <span>{typeLabel(delivery.type)}</span>
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
