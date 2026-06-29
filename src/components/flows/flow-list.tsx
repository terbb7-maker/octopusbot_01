import { Download, Plus } from "lucide-react";

import { CreateFlowDialog } from "@/components/flows/create-flow-dialog";
import { FlowCard } from "@/components/flows/flow-card";
import { FlowEmptyState } from "@/components/flows/flow-empty-state";
import { FlowStats } from "@/components/flows/flow-stats";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import type { FlowsOverview } from "@/server/services/flows";

export function FlowList({ overview }: { overview: FlowsOverview }) {
  return (
    <>
      <PageHeader
        title="Meus Fluxos"
        description="Gerencie seus fluxos de automacao e chatbots."
        action={
          <>
            <Button variant="outline" className="border-white/10" disabled>
              <Download className="size-4" aria-hidden="true" />
              Importar Fluxo
            </Button>
            <CreateFlowDialog
              trigger={
                <Button type="button">
                  <Plus className="size-4" aria-hidden="true" />
                  Criar Fluxo
                </Button>
              }
            />
          </>
        }
      />

      <main className="mx-auto flex w-full max-w-[1500px] flex-col gap-5 p-4 sm:p-6 lg:p-8">
        <FlowStats overview={overview} />

        {overview.flows.length ? (
          <section className="grid gap-4">
            {overview.flows.map((flow) => (
              <FlowCard
                key={flow.id}
                botOptions={overview.botOptions}
                flow={flow}
              />
            ))}
          </section>
        ) : (
          <FlowEmptyState />
        )}
      </main>
    </>
  );
}
