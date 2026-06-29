import { Badge } from "@/components/ui/badge";
import type { TelegramBotStatus, TelegramWebhookStatus } from "@/types/domain";

const statusLabel: Record<TelegramBotStatus, string> = {
  active: "Ativo",
  disabled: "Pausado",
  revoked: "Revogado",
};

const webhookLabel: Record<TelegramWebhookStatus, string> = {
  active: "Webhook ativo",
  pending: "Webhook pendente",
  failed: "Webhook falhou",
  disabled: "Webhook inativo",
};

export function BotStatusBadge({ status }: { status: TelegramBotStatus }) {
  return (
    <Badge
      className={
        status === "active"
          ? "border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
          : "border-white/10 bg-white/[0.04] text-muted-foreground"
      }
    >
      {statusLabel[status]}
    </Badge>
  );
}

export function WebhookStatusBadge({
  status,
}: {
  status: TelegramWebhookStatus;
}) {
  return (
    <Badge variant="outline" className="border-white/10 text-muted-foreground">
      {webhookLabel[status]}
    </Badge>
  );
}
