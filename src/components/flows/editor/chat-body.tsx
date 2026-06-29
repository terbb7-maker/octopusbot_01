"use client";

import { useEffect, useRef } from "react";

export function ChatBody({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current?.scrollTo({ top: ref.current.scrollHeight, behavior: "smooth" });
  }, [children]);

  return (
    <div
      ref={ref}
      className="h-[520px] overflow-y-auto bg-[#12202c] bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] bg-[length:18px_18px] px-3 py-4"
    >
      <div className="space-y-3">{children}</div>
    </div>
  );
}
