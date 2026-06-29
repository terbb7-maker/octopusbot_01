import { type ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "mx-auto w-full max-w-[1500px] px-4 pt-5 sm:px-6 lg:px-8",
        className,
      )}
    >
      <div className="overflow-hidden rounded-md border border-white/10 bg-white/[0.035] shadow-2xl shadow-black/20">
        <div className="relative">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(168,85,247,0.18),transparent_42%),linear-gradient(90deg,rgba(255,255,255,0.045),transparent_58%)]" />
          <div className="relative flex flex-col gap-4 p-5 sm:p-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h1 className="text-xl font-semibold tracking-normal text-foreground sm:text-2xl">
                {title}
              </h1>
              {description ? (
                <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
                  {description}
                </p>
              ) : null}
            </div>
            {action ? (
              <div className="flex shrink-0 items-center gap-2">{action}</div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
