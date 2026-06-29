"use client";

import { useRef } from "react";

import { InitialCtaCard } from "@/components/flows/editor/initial-cta-card";
import { MediaUploader } from "@/components/flows/editor/media-uploader";
import { RichTextEditor } from "@/components/flows/editor/rich-text-editor";
import {
  extractVariables,
  VariablePicker,
} from "@/components/flows/editor/variable-picker";
import type { FlowInitialConfig } from "@/server/services/flows";

type InitialMessageCardProps = {
  config: FlowInitialConfig;
  flowId: string;
  onChange: (config: FlowInitialConfig) => void;
};

export function InitialMessageCard({
  config,
  flowId,
  onChange,
}: InitialMessageCardProps) {
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  function patchConfig(next: Partial<FlowInitialConfig>) {
    onChange({ ...config, ...next });
  }

  function updateMessage(message: string, html: string) {
    patchConfig({
      html,
      message,
      variables: extractVariables(`${message}\n${html}`),
    });
  }

  function insertVariable(variable: string) {
    const textarea = editorRef.current;
    const value = textarea?.value ?? config.message ?? "";
    const start = textarea?.selectionStart ?? value.length;
    const end = textarea?.selectionEnd ?? value.length;
    const next = `${value.slice(0, start)}${variable}${value.slice(end)}`;

    updateMessage(next, next);

    window.requestAnimationFrame(() => {
      editorRef.current?.focus();
      const cursor = start + variable.length;
      editorRef.current?.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20">
      <div>
        <p className="text-xs font-medium uppercase tracking-normal text-primary">
          Editor Basico
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-foreground">
          Mensagem Inicial
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          Mensagem de boas-vindas enviada quando o lead inicia o bot. Suporta
          variaveis dinamicas.
        </p>
      </div>

      <div className="mt-6 grid gap-8">
        <MediaUploader config={config} flowId={flowId} onChange={onChange} />

        <RichTextEditor
          editorRef={editorRef}
          html={config.html ?? ""}
          value={config.message ?? ""}
          onChange={updateMessage}
        />

        <VariablePicker onInsert={insertVariable} />

        <InitialCtaCard config={config} onChange={onChange} />
      </div>
    </div>
  );
}
