"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteBotAction } from "@/server/actions/bots";

type BotDeleteDialogProps = {
  botId: string;
  botName: string;
};

export function BotDeleteDialog({ botId, botName }: BotDeleteDialogProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    startTransition(async () => {
      await deleteBotAction(botId);
      router.refresh();
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="border-white/10 text-destructive">
          <Trash2 className="size-4" aria-hidden="true" />
          Excluir
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir bot?</AlertDialogTitle>
          <AlertDialogDescription>
            O bot {botName} sera removido da listagem e novos fluxos nao usarao
            essa conexao. Historicos operacionais serao preservados.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/10 bg-transparent">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={pending}
            onClick={handleDelete}
            className="bg-destructive text-white hover:bg-destructive/90"
          >
            {pending ? "Excluindo..." : "Excluir"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
