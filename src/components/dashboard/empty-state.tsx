import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-32 flex-col items-center justify-center rounded-md border border-dashed border-white/12 bg-black/25 px-5 py-6 text-center",
        className,
      )}
    >
      <div className="mb-3 flex size-10 items-center justify-center rounded-md border border-primary/20 bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
