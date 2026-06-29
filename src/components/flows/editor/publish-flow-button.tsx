"use client";

import { useState, useTransition } from "react";
import { Loader2, Rocket } from "lucide-react";

import { usePreviewState } from "@/components/flows/editor/preview-state";
import { Button } from "@/components/ui/button";
import { publishFlowAction } from "@/server/actions/flows";

export function PublishFlowButton({ flowId }: { flowId: string }) {
  const { hasUnsavedChanges } = usePreviewState();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handlePublish() {
    setMessage("");
    startTransition(async () => {
      const result = await publishFlowAction(flowId);
      setMessage(result.message);
    });
  }

  return (
    <div className="flex flex-col gap-1">
      <Button
        type="button"
        variant="outline"
        className="border-violet-400/30 bg-violet-500/10 text-violet-100 hover:bg-violet-500/20"
        disabled={isPending || hasUnsavedChanges}
        onClick={handlePublish}
        title={hasUnsavedChanges ? "Salve tudo antes de publicar." : undefined}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Rocket className="size-4" aria-hidden="true" />
        )}
        Publicar
      </Button>
      {message ? (
        <span className="text-right text-xs text-muted-foreground">{message}</span>
      ) : null}
    </div>
  );
}
