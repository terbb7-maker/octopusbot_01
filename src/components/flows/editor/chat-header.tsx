"use client";

import { ChevronLeft, Phone, Search, Tv } from "lucide-react";

import type { FlowPreviewBot } from "@/server/services/flows";

export function ChatHeader({ bot }: { bot: FlowPreviewBot | null }) {
  const displayBot = bot ?? { name: "OctopusBot", username: "octopusbot" };

  return (
    <header className="border-b border-white/10 bg-[#172331]/95 px-4 pb-3 pt-10">
      <div className="flex items-center gap-3">
        <ChevronLeft className="size-5 text-sky-400" aria-hidden="true" />
        <div className="flex size-10 items-center justify-center rounded-full bg-sky-500/20 text-sm font-bold text-sky-300">
          O
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-white">
            {displayBot.name}
          </p>
          <p className="truncate text-xs text-sky-300">
            @{displayBot.username} - online agora
          </p>
        </div>
        <Phone className="size-4 text-sky-400" aria-hidden="true" />
        <Tv className="size-4 text-sky-400" aria-hidden="true" />
        <Search className="size-4 text-sky-400" aria-hidden="true" />
      </div>
    </header>
  );
}
