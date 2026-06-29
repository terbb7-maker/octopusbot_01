import Link from "next/link";
import { Copy, Edit3, Trash2 } from "lucide-react";

import { FlowBindBotsDialog } from "@/components/flows/flow-bind-bots-dialog";
import { FlowStatusBadge } from "@/components/flows/flow-status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  archiveFlowFormAction,
  duplicateFlowFormAction,
} from "@/server/actions/flows";
import type { FlowBotOption, FlowListItem } from "@/server/services/flows";

const kindLabels: Record<FlowListItem["kind"], string> = {
  advanced: "Avancado",
  basic: "Basico",
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(date));
}

export function FlowCard({
  botOptions,
  flow,
}: {
  botOptions: FlowBotOption[];
  flow: FlowListItem;
}) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-base font-semibold text-foreground">
              {flow.name}
            </h2>
            <FlowStatusBadge status={flow.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Fluxo {kindLabels[flow.kind].toLowerCase()}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-4">
          <Metric label="Tipo" value={kindLabels[flow.kind]} />
          <Metric label="Bots vinculados" value={String(flow.linkedBots)} />
          <Metric label="Status" value={<FlowStatusBadge status={flow.status} />} />
          <Metric label="Ultima edicao" value={formatDate(flow.lastEditedAt)} />
        </div>

        <div className="flex flex-col gap-2 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
          <Button asChild variant="outline" className="border-white/10">
            <Link href={`/flows/${flow.id}/editor/basic`}>
              <Edit3 className="size-4" aria-hidden="true" />
              Editar
            </Link>
          </Button>
          <FlowBindBotsDialog bots={botOptions} flow={flow} />
          <form action={duplicateFlowFormAction}>
            <input type="hidden" name="flowId" value={flow.id} />
            <Button type="submit" variant="outline" className="w-full border-white/10">
              <Copy className="size-4" aria-hidden="true" />
              Duplicar
            </Button>
          </form>
          <form action={archiveFlowFormAction}>
            <input type="hidden" name="flowId" value={flow.id} />
            <Button
              type="submit"
              variant="outline"
              className="w-full border-white/10 text-destructive"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              Excluir
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <div className="rounded-md border border-white/10 bg-black/20 p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-2 truncate text-sm font-semibold text-foreground">
        {value}
      </div>
    </div>
  );
}
