"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, Edit3, Pause, Play, ShoppingCart, Users } from "lucide-react";

import { BotDeleteDialog } from "@/components/bots/bot-delete-dialog";
import { BotStatusBadge, WebhookStatusBadge } from "@/components/bots/bot-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { pauseBotAction, resumeBotAction } from "@/server/actions/bots";
import type { BotListItem } from "@/server/services/bots";

type BotCardProps = {
  bot: BotListItem;
  onEdit: (bot: BotListItem) => void;
};

function formatDate(date: string | null) {
  if (!date) return "Sem atividade";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

export function BotCard({ bot, onEdit }: BotCardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const isPaused = bot.status === "disabled";

  function toggleStatus() {
    startTransition(async () => {
      if (isPaused) {
        await resumeBotAction(bot.id);
      } else {
        await pauseBotAction(bot.id);
      }

      router.refresh();
    });
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <div
            className="flex size-14 shrink-0 items-center justify-center rounded-md border border-white/10 bg-primary/10 bg-cover bg-center text-primary"
            style={bot.avatarUrl ? { backgroundImage: `url(${bot.avatarUrl})` } : undefined}
          >
            {!bot.avatarUrl ? <Bot className="size-7" aria-hidden="true" /> : null}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-base font-semibold text-foreground">
                {bot.name}
              </h2>
              <BotStatusBadge status={bot.status} />
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              @{bot.username}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <WebhookStatusBadge status={bot.webhookStatus} />
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <Metric label="Fluxo conectado" value={bot.flowName ?? "Nenhum fluxo conectado"} />
          <Metric icon={Users} label="Leads" value={String(bot.leads)} />
          <Metric icon={ShoppingCart} label="Vendas" value={String(bot.sales)} />
          <Metric label="Ultima atividade" value={formatDate(bot.lastActivityAt)} />
        </div>

        {bot.status === "disabled" || bot.webhookStatus === "failed" ? (
          <div className="rounded-md border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-100">
            Bot desconectado ou pausado. Reative o bot ou atualize o token para
            voltar a receber eventos do Telegram.
          </div>
        ) : null}

        <div className="flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
          <Button variant="outline" className="border-white/10" onClick={() => onEdit(bot)}>
            <Edit3 className="size-4" aria-hidden="true" />
            Editar
          </Button>
          <Button
            variant="outline"
            className="border-white/10"
            disabled={pending}
            onClick={toggleStatus}
          >
            {isPaused ? (
              <Play className="size-4" aria-hidden="true" />
            ) : (
              <Pause className="size-4" aria-hidden="true" />
            )}
            {isPaused ? "Reativar" : "Pausar"}
          </Button>
          <BotDeleteDialog botId={bot.id} botName={bot.name} />
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon?: typeof Users;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-3">
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        {Icon ? <Icon className="size-3.5" aria-hidden="true" /> : null}
        {label}
      </p>
      <p className="mt-2 truncate text-sm font-semibold text-foreground">
        {value}
      </p>
    </div>
  );
}
