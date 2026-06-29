import { Badge } from "@/components/ui/badge";
import type { FlowStatus } from "@/types/domain";

const statusLabels: Record<FlowStatus, string> = {
  active: "Ativo",
  archived: "Arquivado",
  draft: "Rascunho",
  paused: "Pausado",
};

const statusClasses: Record<FlowStatus, string> = {
  active: "border-emerald-400/20 bg-emerald-400/10 text-emerald-300",
  archived: "border-white/10 bg-white/[0.04] text-muted-foreground",
  draft: "border-primary/25 bg-primary/10 text-primary",
  paused: "border-amber-400/20 bg-amber-400/10 text-amber-200",
};

export function FlowStatusBadge({ status }: { status: FlowStatus }) {
  return (
    <Badge variant="outline" className={statusClasses[status]}>
      {statusLabels[status]}
    </Badge>
  );
}
