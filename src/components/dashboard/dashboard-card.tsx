import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type DashboardCardProps = {
  children: ReactNode;
  className?: string;
};

export function DashboardCard({ children, className }: DashboardCardProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-lg border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/20",
        "before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] before:bg-[size:28px_28px] before:opacity-[0.18]",
        "after:pointer-events-none after:absolute after:inset-0 after:bg-[linear-gradient(135deg,rgba(168,85,247,0.11),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.045),transparent_45%)]",
        className,
      )}
    >
      <div className="relative z-10 h-full">{children}</div>
    </section>
  );
}

export function DashboardCardHeader({
  children,
  className,
}: DashboardCardProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 p-5", className)}>
      {children}
    </div>
  );
}

export function DashboardCardBody({
  children,
  className,
}: DashboardCardProps) {
  return <div className={cn("p-5 pt-0", className)}>{children}</div>;
}

export function Eyebrow({
  children,
  className,
}: DashboardCardProps) {
  return (
    <p
      className={cn(
        "text-xs font-semibold uppercase tracking-normal text-muted-foreground",
        className,
      )}
    >
      {children}
    </p>
  );
}
