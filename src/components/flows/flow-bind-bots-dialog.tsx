"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bot, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateFlowBotBindingsAction } from "@/server/actions/flows";
import type { FlowBotOption, FlowListItem } from "@/server/services/flows";

type FlowBindBotsDialogProps = {
  bots: FlowBotOption[];
  flow: FlowListItem;
};

export function FlowBindBotsDialog({ bots, flow }: FlowBindBotsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState<string[]>(
    bots
      .filter((bot) => bot.connectedFlowId === flow.id)
      .map((bot) => bot.id),
  );
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function toggleBot(botId: string) {
    setSelected((current) =>
      current.includes(botId)
        ? current.filter((id) => id !== botId)
        : [...current, botId],
    );
  }

  function saveBindings() {
    setMessage("Salvando vinculos...");
    startTransition(async () => {
      const result = await updateFlowBotBindingsAction(flow.id, selected);

      setMessage(result.message);

      if (result.ok) {
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-white/10">
          <Link2 className="size-4" aria-hidden="true" />
          Vincular Bots
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Vincular Bots</DialogTitle>
          <DialogDescription>
            Escolha quais bots devem usar o fluxo {flow.name}. Cada bot pode ter
            apenas um fluxo ativo.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          {bots.length ? (
            bots.map((bot) => {
              const checked = selectedSet.has(bot.id);
              const connectedElsewhere =
                bot.connectedFlowId && bot.connectedFlowId !== flow.id;

              return (
                <label
                  key={bot.id}
                  className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/10 bg-white/[0.035] p-4 transition-colors hover:bg-white/[0.06]"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleBot(bot.id)}
                    className="mt-1"
                  />
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Bot className="size-5" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {bot.name}
                      </p>
                      <span className="rounded-md border border-white/10 px-2 py-0.5 text-xs text-muted-foreground">
                        {bot.status}
                      </span>
                    </div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                      @{bot.username}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {connectedElsewhere
                        ? `Atualmente conectado a ${bot.connectedFlowName}. Ao salvar, sera movido para este fluxo.`
                        : bot.connectedFlowId === flow.id
                          ? "Conectado a este fluxo."
                          : "Nenhum fluxo conectado."}
                    </p>
                  </div>
                </label>
              );
            })
          ) : (
            <div className="rounded-md border border-dashed border-white/15 bg-black/20 p-5 text-sm leading-6 text-muted-foreground">
              Nenhum bot cadastrado. Conecte um bot antes de vincular fluxos.
            </div>
          )}
        </div>

        {message ? (
          <p className="text-sm text-muted-foreground">{message}</p>
        ) : null}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            className="border-white/10"
            onClick={() => setOpen(false)}
          >
            Cancelar
          </Button>
          <Button type="button" disabled={pending || !bots.length} onClick={saveBindings}>
            Salvar vinculos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
