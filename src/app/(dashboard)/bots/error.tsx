"use client";

import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function BotsError({ reset }: { reset: () => void }) {
  return (
    <div className="mx-auto flex w-full max-w-[1500px] p-4 sm:p-6 lg:p-8">
      <section className="flex min-h-80 w-full flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.025] px-6 py-10 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-md border border-destructive/25 bg-destructive/10 text-destructive">
          <AlertCircle className="size-7" aria-hidden="true" />
        </div>
        <h2 className="text-lg font-semibold text-foreground">
          Nao foi possivel carregar seus bots
        </h2>
        <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
          Tente novamente. Se o problema continuar, verifique a conexao com o
          Supabase e as politicas RLS.
        </p>
        <Button type="button" onClick={reset} className="mt-5">
          Tentar novamente
        </Button>
      </section>
    </div>
  );
}
