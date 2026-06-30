"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, Save, TriangleAlert } from "lucide-react";

import { usePreviewState } from "@/components/flows/editor/preview-state";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SaveBar() {
  const {
    hasUnsavedChanges,
    isSaving,
    lastSaveMessage,
    lastSaveStatus,
    saveAll,
  } = usePreviewState();
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (!toast) return;

    const timeout = window.setTimeout(() => setToast(""), 3200);

    return () => window.clearTimeout(timeout);
  }, [toast]);

  async function handleSave() {
    const result = await saveAll();
    setToast(result.message);
  }

  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div
          className={cn(
            "flex items-center gap-2 text-xs",
            lastSaveStatus === "error"
              ? "text-destructive"
              : hasUnsavedChanges
                ? "text-amber-300"
                : "text-muted-foreground",
          )}
        >
          {lastSaveStatus === "error" ? (
            <TriangleAlert className="size-4" aria-hidden="true" />
          ) : hasUnsavedChanges ? (
            <TriangleAlert className="size-4" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="size-4" aria-hidden="true" />
          )}
          <span>{lastSaveMessage}</span>
        </div>
        <Button
          type="button"
          disabled={isSaving || !hasUnsavedChanges}
          onClick={handleSave}
        >
          {isSaving ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Save className="size-4" aria-hidden="true" />
          )}
          Salvar tudo
        </Button>
      </div>

      {toast ? (
        <div
          className={cn(
            "fixed right-4 top-4 z-[80] rounded-lg border px-4 py-3 text-sm shadow-2xl shadow-black/40",
            lastSaveStatus === "error"
              ? "border-destructive/40 bg-destructive/15 text-destructive"
              : "border-emerald-400/30 bg-emerald-400/15 text-emerald-200",
          )}
        >
          {toast}
        </div>
      ) : null}
    </>
  );
}
