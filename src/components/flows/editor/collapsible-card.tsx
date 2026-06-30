"use client";

import { useEffect, useId, useState } from "react";
import { ChevronDown, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

type CollapsibleCardProps = {
  actions?: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  icon?: LucideIcon;
  storageKey?: string;
  summary?: React.ReactNode;
  title: string;
};

export function CollapsibleCard({
  actions,
  children,
  defaultOpen = true,
  icon: Icon,
  storageKey,
  summary,
  title,
}: CollapsibleCardProps) {
  const bodyId = useId();
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    if (!storageKey) return;

    const stored = window.localStorage.getItem(storageKey);

    if (stored === "open") setOpen(true);
    if (stored === "closed") setOpen(false);
  }, [storageKey]);

  function toggle() {
    setOpen((current) => {
      const next = !current;

      if (storageKey) {
        window.localStorage.setItem(storageKey, next ? "open" : "closed");
      }

      return next;
    });
  }

  return (
    <article className="overflow-hidden rounded-lg border border-white/10 bg-black/20 shadow-2xl shadow-black/10">
      <div
        role="button"
        tabIndex={0}
        aria-controls={bodyId}
        aria-expanded={open}
        onClick={toggle}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggle();
          }
        }}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-white/[0.035]"
      >
        <span className="grid size-9 shrink-0 place-items-center rounded-md border border-white/10 bg-primary/10 text-primary">
          {Icon ? <Icon className="size-4" aria-hidden="true" /> : null}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground">
            {title}
          </span>
          {summary ? (
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
              {summary}
            </span>
          ) : null}
        </span>
        {actions ? (
          <span
            className="flex shrink-0 gap-2"
            onClick={(event) => event.stopPropagation()}
          >
            {actions}
          </span>
        ) : null}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </div>

      <div
        id={bodyId}
        className={cn(
          "grid transition-[grid-template-rows] duration-200 ease-out",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-white/10 p-4">{children}</div>
        </div>
      </div>
    </article>
  );
}
