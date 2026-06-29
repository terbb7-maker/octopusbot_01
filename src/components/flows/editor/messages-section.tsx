"use client";

import { useState } from "react";

import { MessageTemplateCard } from "@/components/flows/editor/message-template-card";
import { usePreviewState } from "@/components/flows/editor/preview-state";
import { uploadFlowMessageMediaAction } from "@/server/actions/flows";
import type {
  BasicFlowEditorData,
  FlowMessageKind,
  FlowMessageTemplate,
} from "@/server/services/flows";

type MessagesSectionProps = {
  flow: BasicFlowEditorData;
};

const messageDefinitions: Array<{
  description: string;
  kind: FlowMessageKind;
  title: string;
}> = [
  {
    kind: "pix_generated",
    title: "PIX Gerado",
    description: "Mensagem enviada quando o PIX e criado.",
  },
  {
    kind: "payment_approved",
    title: "Pagamento Aprovado",
    description: "Mensagem enviada apos confirmacao do pagamento.",
  },
  {
    kind: "pix_expired",
    title: "PIX Expirado",
    description: "Mensagem enviada quando o PIX perde validade.",
  },
  {
    kind: "error",
    title: "Erro",
    description: "Mensagem para falhas operacionais ou indisponibilidade.",
  },
  {
    kind: "cancellation",
    title: "Cancelamento",
    description: "Mensagem enviada em cancelamentos ou desistencias.",
  },
  {
    kind: "social_proof",
    title: "Prova Social",
    description: "Mensagem usada para reforcar confianca e conversao.",
  },
];

export function MessagesSection({ flow }: MessagesSectionProps) {
  const { messages, setMessages } = usePreviewState();
  const [uploadState, setUploadState] = useState("");

  function updateTemplate(template: FlowMessageTemplate) {
    setMessages({
      ...messages,
      [template.kind]: template,
    });
  }

  async function uploadMedia(kind: FlowMessageKind, file: File) {
    if (messages[kind].media.length >= 5) {
      setUploadState("Limite de 5 midias por mensagem.");
      return;
    }

    setUploadState("Enviando midia...");
    const formData = new FormData();
    formData.set("file", file);
    formData.set("flowId", flow.id);
    formData.set("kind", kind);

    const result = await uploadFlowMessageMediaAction(formData);

    if (!result.ok || !("media" in result) || !result.media) {
      setUploadState(result.message);
      return;
    }

    setMessages({
      ...messages,
      [kind]: {
        ...messages[kind],
        media: [...messages[kind].media, result.media],
      },
    });
    setUploadState("Midia pronta para salvar.");
  }

  return (
    <div>
      <div className="rounded-lg border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20">
        <div>
          <p className="text-xs font-medium uppercase tracking-normal text-primary">
            Editor Basico
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-foreground">
            Mensagens
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
            Configure os textos, midias, botoes e variaveis usados nas mensagens
            automaticas do fluxo.
          </p>
        </div>

        <div className="mt-6 grid gap-4">
          {messageDefinitions.map((definition) => (
            <MessageTemplateCard
              key={definition.kind}
              description={definition.description}
              onChange={updateTemplate}
              onMediaUpload={(file) => uploadMedia(definition.kind, file)}
              template={messages[definition.kind]}
              title={definition.title}
            />
          ))}
        </div>

        <div className="mt-5 border-t border-white/10 pt-4 text-xs text-muted-foreground">
          {uploadState || "Edite as mensagens e use Salvar tudo para persistir."}
        </div>
      </div>
    </div>
  );
}
