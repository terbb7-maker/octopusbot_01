import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type {
  FlowPlanDeliveryConfig,
  FlowPlanDeliveryType,
  TelegramDeliveryDestination,
} from "@/server/services/flows";

type DeliverySelectorProps = {
  allowDefault?: boolean;
  config: FlowPlanDeliveryConfig;
  destinations: TelegramDeliveryDestination[];
  type: FlowPlanDeliveryType;
  onChange: (type: FlowPlanDeliveryType, config: FlowPlanDeliveryConfig) => void;
};

const labels: Record<FlowPlanDeliveryType, string> = {
  custom_message: "Mensagem personalizada",
  default: "Usar entrega padrao do fluxo",
  link: "Link",
  telegram_channel: "Canal Telegram",
  telegram_group: "Grupo Telegram",
};

export function DeliverySelector({
  allowDefault = true,
  config,
  destinations,
  onChange,
  type,
}: DeliverySelectorProps) {
  const filteredDestinations = destinations.filter((destination) => {
    if (type === "telegram_group") {
      return ["group", "supergroup"].includes(destination.chatType);
    }

    if (type === "telegram_channel") return destination.chatType === "channel";

    return false;
  });

  return (
    <section className="grid gap-3">
      <div>
        <h3 className="text-sm font-semibold text-foreground">Entrega deste plano</h3>
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
          {allowDefault ? <option value="default">{labels.default}</option> : null}
          <option value="telegram_group">{labels.telegram_group}</option>
          <option value="telegram_channel">{labels.telegram_channel}</option>
          <option value="link">{labels.link}</option>
          <option value="custom_message">{labels.custom_message}</option>
        </select>
      </div>

      {type === "telegram_group" || type === "telegram_channel" ? (
        <div className="grid gap-2">
          <Label>{labels[type]}</Label>
          <select
            value={config.telegramDestinationId ?? ""}
            onChange={(event) =>
              onChange(type, {
                ...config,
                telegramDestinationId: event.target.value,
              })
            }
            className="h-10 rounded-md border border-white/10 bg-black/30 px-3 text-sm text-foreground outline-none"
          >
            <option value="">Selecione um destino encontrado</option>
            {filteredDestinations.map((destination) => (
              <option key={destination.id} value={destination.id}>
                {destination.title} - {destination.botName}
              </option>
            ))}
          </select>
          {!filteredDestinations.length ? (
            <p className="text-xs text-muted-foreground">
              Nenhum destino encontrado para os bots vinculados.
            </p>
          ) : null}
        </div>
      ) : null}

      {type === "link" ? (
        <div className="grid gap-2">
          <Label>Link de entrega</Label>
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
        <div className="grid gap-2">
          <Label>Mensagem</Label>
          <Textarea
            value={config.message ?? ""}
            onChange={(event) =>
              onChange(type, { ...config, message: event.target.value })
            }
            placeholder="Mensagem de entrega. Suporta variaveis como {{lead.name}}."
            className="min-h-28"
          />
        </div>
      ) : null}
    </section>
  );
}
