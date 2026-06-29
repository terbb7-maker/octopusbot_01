"use client";

import { useCallback, useState } from "react";
import { Play, Send } from "lucide-react";

import { ChatBody } from "@/components/flows/editor/chat-body";
import { ChatHeader } from "@/components/flows/editor/chat-header";
import { PhoneFrame } from "@/components/flows/editor/phone-frame";
import {
  PreviewRenderer,
  type PreviewPhase,
} from "@/components/flows/editor/preview-renderer";
import { TelegramKeyboard } from "@/components/flows/editor/telegram-keyboard";
import { Button } from "@/components/ui/button";
import type { PreviewStateValue } from "@/components/flows/editor/preview-state";

export function TelegramSimulator({ state }: { state: PreviewStateValue }) {
  const [phase, setPhase] = useState<PreviewPhase>("initial");
  const telegramUrl = state.bot
    ? `https://t.me/${state.bot.username.replace(/^@/, "")}`
    : null;
  const restart = useCallback(() => setPhase("initial"), []);

  return (
    <div className="space-y-3">
      <PhoneFrame>
        <ChatHeader bot={state.bot} />
        <ChatBody>
          <PreviewRenderer
            onPhaseChange={setPhase}
            phase={phase}
            state={state}
          />
        </ChatBody>
        <TelegramKeyboard />
      </PhoneFrame>

      <div className="mx-auto grid max-w-[360px] grid-cols-2 gap-2">
        <Button type="button" variant="outline" onClick={restart}>
          <Play className="size-4" aria-hidden="true" />
          Iniciar
        </Button>
        <Button asChild={Boolean(telegramUrl)} disabled={!telegramUrl}>
          {telegramUrl ? (
            <a href={telegramUrl} target="_blank" rel="noreferrer">
              <Send className="size-4" aria-hidden="true" />
              Abrir no Telegram
            </a>
          ) : (
            <span>
              <Send className="size-4" aria-hidden="true" />
              Abrir no Telegram
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
