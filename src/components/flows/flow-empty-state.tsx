import { GitBranch, Plus } from "lucide-react";

import { CreateFlowDialog } from "@/components/flows/create-flow-dialog";
import { Button } from "@/components/ui/button";

export function FlowEmptyState() {
  return (
    <section className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed border-white/15 bg-white/[0.025] px-6 py-10 text-center">
      <div className="mb-4 flex size-14 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
        <GitBranch className="size-7" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">
        Nenhum fluxo criado
      </h2>
      <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
        Crie seu primeiro fluxo para organizar conversas, automacoes e
        conexoes com bots.
      </p>
      <CreateFlowDialog
        trigger={
          <Button type="button" className="mt-5">
            <Plus className="size-4" aria-hidden="true" />
            Criar Fluxo
          </Button>
        }
      />
    </section>
  );
}
