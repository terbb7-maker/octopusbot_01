"use client";

import { type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Info, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createFlowFromDialogAction } from "@/server/actions/flows";

type CreateFlowDialogProps = {
  trigger: ReactNode;
};

export function CreateFlowDialog({ trigger }: CreateFlowDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Criar Fluxo</DialogTitle>
          <DialogDescription>
            Configure o ponto de partida do seu novo fluxo.
          </DialogDescription>
        </DialogHeader>

        <form action={createFlowFromDialogAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="flow-name">Nome do Fluxo</Label>
            <Input
              id="flow-name"
              name="name"
              maxLength={30}
              required
              placeholder="Ex: Atendimento inicial"
              className="h-11"
            />
            <p className="text-xs text-muted-foreground">
              Maximo de 30 caracteres.
            </p>
          </div>

          <div className="space-y-3">
            <Label>Modo</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="cursor-pointer rounded-md border border-primary/30 bg-primary/10 p-4 shadow-lg shadow-primary/5">
                <input
                  type="radio"
                  name="mode"
                  value="basic"
                  defaultChecked
                  className="sr-only"
                />
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      Modo Basico
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Estrutura simples para montar conversas guiadas.
                    </p>
                  </div>
                  <Sparkles className="size-4 text-primary" aria-hidden="true" />
                </div>
              </label>

              <div className="group relative rounded-md border border-white/10 bg-white/[0.025] p-4 opacity-70">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-muted-foreground">
                        Modo Avancado
                      </p>
                      <span className="rounded-md border border-amber-400/20 bg-amber-400/10 px-2 py-0.5 text-[11px] font-semibold text-amber-200">
                        Em Breve
                      </span>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">
                      Recursos para logica condicional, IA e integracoes.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled
                    className="rounded-md p-1 text-muted-foreground"
                    aria-label="Modo avancado em breve"
                  >
                    <Info className="size-4" aria-hidden="true" />
                  </button>
                </div>
                <div className="pointer-events-none absolute right-3 top-12 z-10 hidden w-56 rounded-md border border-white/10 bg-[#101014] p-3 text-xs leading-5 text-muted-foreground shadow-2xl shadow-black/40 group-hover:block group-focus-within:block">
                  O modo avancado sera lancado futuramente para fluxos com IA,
                  testes A/B, integracoes e logicas complexas.
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 rounded-md border border-white/10 bg-black/20 p-4 text-sm leading-6 text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">Modo Basico:</span>{" "}
              ideal para criar rapidamente um fluxo de conversa simples.
            </p>
            <p>
              <span className="font-medium text-foreground">Modo Avancado:</span>{" "}
              sera usado para automacoes com IA, regras, variantes e
              integracoes.
            </p>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" className="border-white/10">
                Cancelar
              </Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Criando..." : "Criar Fluxo"}
    </Button>
  );
}
