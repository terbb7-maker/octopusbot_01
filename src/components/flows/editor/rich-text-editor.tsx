"use client";

import type { RefObject } from "react";
import { useState } from "react";
import { Bold, Code2, EyeOff, Italic, Strikethrough, Underline } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type RichTextEditorProps = {
  editorRef: RefObject<HTMLTextAreaElement | null>;
  html: string;
  value: string;
  onChange: (value: string, html: string) => void;
};

const maxLength = 4000;

function wrapSelection(
  textarea: HTMLTextAreaElement,
  value: string,
  before: string,
  after: string,
) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = value.slice(start, end) || "texto";

  return {
    next: `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`,
    cursor: start + before.length + selected.length + after.length,
  };
}

export function RichTextEditor({
  editorRef,
  html,
  onChange,
  value,
}: RichTextEditorProps) {
  const [htmlMode, setHtmlMode] = useState(false);
  const content = htmlMode ? html || value : value;

  function applyFormat(before: string, after: string) {
    const textarea = editorRef.current;

    if (!textarea) return;

    const formatted = wrapSelection(textarea, content, before, after);

    if (htmlMode) {
      onChange(value, formatted.next);
    } else {
      onChange(formatted.next, formatted.next);
    }

    window.requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(formatted.cursor, formatted.cursor);
    });
  }

  return (
    <section className="grid gap-3">
      <div className="flex flex-wrap items-center gap-2 rounded-md border border-white/10 bg-black/20 p-2">
        <Button type="button" size="icon" variant="ghost" onClick={() => applyFormat("<b>", "</b>")}>
          <Bold className="size-4" aria-hidden="true" />
          <span className="sr-only">Negrito</span>
        </Button>
        <Button type="button" size="icon" variant="ghost" onClick={() => applyFormat("<i>", "</i>")}>
          <Italic className="size-4" aria-hidden="true" />
          <span className="sr-only">Italico</span>
        </Button>
        <Button type="button" size="icon" variant="ghost" onClick={() => applyFormat("<u>", "</u>")}>
          <Underline className="size-4" aria-hidden="true" />
          <span className="sr-only">Sublinhado</span>
        </Button>
        <Button type="button" size="icon" variant="ghost" onClick={() => applyFormat("<s>", "</s>")}>
          <Strikethrough className="size-4" aria-hidden="true" />
          <span className="sr-only">Riscado</span>
        </Button>
        <Button type="button" size="icon" variant="ghost" onClick={() => applyFormat("<code>", "</code>")}>
          <Code2 className="size-4" aria-hidden="true" />
          <span className="sr-only">Codigo</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="ml-auto border-white/10"
          onClick={() => setHtmlMode((current) => !current)}
        >
          <EyeOff className="size-4" aria-hidden="true" />
          {htmlMode ? "Ocultar HTML" : "Modo HTML"}
        </Button>
      </div>

      <Textarea
        ref={editorRef}
        value={content}
        maxLength={maxLength}
        onChange={(event) =>
          htmlMode
            ? onChange(value, event.target.value)
            : onChange(event.target.value, event.target.value)
        }
        placeholder="Escreva a mensagem de boas-vindas..."
        className="min-h-[260px] resize-y border-white/10 bg-black/20 text-base leading-7"
      />
      <div className="text-right text-xs text-muted-foreground">
        {content.length} / {maxLength} caracteres
      </div>
    </section>
  );
}
