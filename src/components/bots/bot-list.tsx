"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { BotCard } from "@/components/bots/bot-card";
import { BotEmptyState } from "@/components/bots/bot-empty-state";
import { BotStats } from "@/components/bots/bot-stats";
import { ConnectBotDialog } from "@/components/bots/connect-bot-dialog";
import { Button } from "@/components/ui/button";
import type { BotListItem, BotsOverview } from "@/server/services/bots";

type BotListProps = {
  overview: BotsOverview;
};

export function BotList({ overview }: BotListProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBot, setEditingBot] = useState<BotListItem | null>(null);

  function openCreateDialog() {
    setEditingBot(null);
    setDialogOpen(true);
  }

  function openEditDialog(bot: BotListItem) {
    setEditingBot(bot);
    setDialogOpen(true);
  }

  return (
    <>
      <header className="mx-auto w-full max-w-[1500px] px-4 pt-5 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-md border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/20">
          <div className="relative">
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(168,85,247,0.18),transparent_42%),linear-gradient(90deg,rgba(255,255,255,0.045),transparent_58%)]" />
            <div className="relative flex flex-col gap-4 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h1 className="text-xl font-semibold tracking-normal text-foreground sm:text-2xl">
                  Meus Robos
                </h1>
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  Gerencie seus bots do Telegram.
                </p>
              </div>
              <Button
                type="button"
                onClick={openCreateDialog}
                disabled={overview.totalBots >= overview.limit}
              >
                <Plus className="size-4" aria-hidden="true" />
                Conectar Bot ({overview.totalBots}/{overview.limit})
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 p-4 sm:p-6 lg:p-8">
        <BotStats overview={overview} />

        {overview.bots.length ? (
          <section className="grid gap-4">
            {overview.bots.map((bot) => (
              <BotCard key={bot.id} bot={bot} onEdit={openEditDialog} />
            ))}
          </section>
        ) : (
          <BotEmptyState onConnect={openCreateDialog} />
        )}
      </main>

      <ConnectBotDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        bot={editingBot}
      />
    </>
  );
}
