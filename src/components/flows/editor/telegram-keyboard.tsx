"use client";

import { SendHorizontal } from "lucide-react";

export function TelegramKeyboard() {
  return (
    <footer className="border-t border-white/10 bg-[#172331] px-3 py-3">
      <div className="flex items-center gap-2">
        <div className="flex-1 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/35">
          Aguardando...
        </div>
        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-full bg-sky-500/15 text-sky-300"
          aria-label="Enviar"
        >
          <SendHorizontal className="size-4" aria-hidden="true" />
        </button>
      </div>
    </footer>
  );
}
