"use client";

import { cn } from "@/lib/utils";

export function MessageBubble({
  children,
  from = "bot",
}: {
  children: React.ReactNode;
  from?: "bot" | "user";
}) {
  return (
    <div
      className={cn(
        "animate-in fade-in-0 slide-in-from-bottom-1 duration-300",
        from === "user" ? "ml-auto max-w-[84%]" : "mr-auto max-w-[88%]",
      )}
    >
      <div
        className={cn(
          "rounded-2xl px-3 py-2 text-sm leading-6 shadow-lg",
          from === "user"
            ? "rounded-br-md bg-primary text-primary-foreground"
            : "rounded-bl-md border border-white/10 bg-[#1e2c38] text-white",
        )}
      >
        {children}
      </div>
    </div>
  );
}
