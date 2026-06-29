import { DeliverySelector } from "@/components/flows/editor/delivery-selector";
import type {
  FlowPlanDefaultDelivery,
  FlowPlanDeliveryType,
  TelegramDeliveryDestination,
} from "@/server/services/flows";

type DefaultDeliveryCardProps = {
  delivery: FlowPlanDefaultDelivery;
  destinations: TelegramDeliveryDestination[];
  onChange: (delivery: FlowPlanDefaultDelivery) => void;
};

export function DefaultDeliveryCard({
  delivery,
  destinations,
  onChange,
}: DefaultDeliveryCardProps) {
  return (
    <section className="rounded-lg border border-white/10 bg-black/20 p-5">
      <h3 className="text-base font-semibold text-foreground">
        Entrega Padrao (Fallback)
      </h3>
      <p className="mt-2 text-sm text-muted-foreground">
        Utilizada quando um plano estiver configurado para usar a entrega padrao
        do fluxo.
      </p>
      <div className="mt-5">
        <DeliverySelector
          allowDefault={false}
          config={{
            linkUrl: delivery.linkUrl,
            message: delivery.message,
            telegramDestinationId: delivery.telegramDestinationId,
          }}
          destinations={destinations}
          type={delivery.type}
          onChange={(type, config) =>
            onChange({
              type: type as Exclude<FlowPlanDeliveryType, "default">,
              linkUrl: config.linkUrl ?? "",
              message: config.message ?? "",
              telegramDestinationId: config.telegramDestinationId ?? "",
            })
          }
        />
      </div>
    </section>
  );
}
