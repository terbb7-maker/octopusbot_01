import { Bot, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

type BotEmptyStateProps = {
  onConnect: () => void;
};

export function BotEmptyState({ onConnect }: BotEmptyStateProps) {
  return (
    <section className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.025] px-6 py-10 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
        <Bot className="size-7" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">
        Nenhum bot cadastrado
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Conecte seu primeiro bot do Telegram para receber mensagens, gerar PIX e
        preparar fluxos de atendimento.
      </p>
      <Button type="button" onClick={onConnect} className="mt-5">
        <Plus className="size-4" aria-hidden="true" />
        Conectar Bot
      </Button>
    </section>
  );
}
