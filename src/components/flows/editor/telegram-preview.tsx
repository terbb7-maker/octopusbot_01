"use client";

import { Smartphone } from "lucide-react";

import { TelegramSimulator } from "@/components/flows/editor/telegram-simulator";
import { usePreviewState } from "@/components/flows/editor/preview-state";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export function TelegramPreview() {
  const state = usePreviewState();

  return (
    <>
      <aside className="hidden xl:block xl:sticky xl:top-5 xl:self-start">
        <p className="mb-3 text-xs font-medium uppercase tracking-normal text-muted-foreground">
          Preview Telegram
        </p>
        <TelegramSimulator state={state} />
      </aside>

      <div className="fixed bottom-4 right-4 z-40 xl:hidden">
        <Dialog>
          <DialogTrigger asChild>
            <Button type="button" className="shadow-2xl shadow-black/40">
              <Smartphone className="size-4" aria-hidden="true" />
              Preview
            </Button>
          </DialogTrigger>
          <DialogContent className="!left-auto !right-0 !top-0 h-svh max-h-svh w-full max-w-[430px] !translate-x-0 !translate-y-0 overflow-y-auto rounded-none border-y-0 border-r-0 p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>Preview Telegram</DialogTitle>
            </DialogHeader>
            <TelegramSimulator state={state} />
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
