"use client";

import { cn } from "@/lib/utils";

export function PhoneFrame({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[360px] rounded-[2.4rem] border-[7px] border-[#20242b] bg-[#111923] p-2 shadow-2xl shadow-black/50",
        className,
      )}
    >
      <div className="absolute left-1/2 top-3 z-20 h-7 w-28 -translate-x-1/2 rounded-full bg-black" />
      <div className="overflow-hidden rounded-[1.9rem] border border-white/10 bg-[#12202c]">
        {children}
      </div>
      <div className="absolute bottom-3 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-white/35" />
    </div>
  );
}
