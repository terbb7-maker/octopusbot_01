"use client";

import { memo } from "react";

import { flowButtonColorHex } from "@/components/flows/editor/button-config-field";
import {
  formatPreviewPrice,
  renderPreviewText,
} from "@/components/flows/editor/preview-variable-provider";
import { MediaRenderer } from "@/components/flows/editor/media-renderer";
import { MessageBubble } from "@/components/flows/editor/message-bubble";
import { TelegramButtons } from "@/components/flows/editor/telegram-buttons";
import type { PreviewStateValue } from "@/components/flows/editor/preview-state";

export type PreviewPhase =
  | "initial"
  | "plans"
  | "pix"
  | "approved"
  | "delivery"
  | "order-bump"
  | "upsell"
  | "downsell";

type PreviewRendererProps = {
  onPhaseChange: (phase: PreviewPhase) => void;
  phase: PreviewPhase;
  state: PreviewStateValue;
};

function initialMediaItems(state: PreviewStateValue) {
  const media = state.initialConfig.media;

  if (!media) return [];

  if (media.type === "video") return media.video ? [media.video] : [];
  if (media.type === "audio") return media.audio ? [media.audio] : [];

  return media.images?.length ? media.images : media.image ? [media.image] : [];
}

function offerMediaItems(state: PreviewStateValue) {
  const media = state.orderBumps.global.media;

  if (!media) {
    return state.orderBumps.global.image ? [state.orderBumps.global.image] : [];
  }

  if (media.type === "video") return media.video ? [media.video] : [];
  if (media.type === "audio") return media.audio ? [media.audio] : [];

  return media.images?.length ? media.images : media.image ? [media.image] : [];
}

function sequenceMediaItems(sequence: PreviewStateValue["upsells"][number]) {
  const media = sequence.media;

  if (!media) return sequence.image ? [sequence.image] : [];
  if (media.type === "video") return media.video ? [media.video] : [];
  if (media.type === "audio") return media.audio ? [media.audio] : [];

  return media.images?.length ? media.images : media.image ? [media.image] : [];
}

export const PreviewRenderer = memo(function PreviewRenderer({
  onPhaseChange,
  phase,
  state,
}: PreviewRendererProps) {
  const cta = state.initialConfig.cta;
  const ctaEnabled = Boolean(cta?.enabled);

  function renderPlans() {
    return state.plans.length ? (
      <MessageBubble>
        <p className="whitespace-pre-wrap">
          {renderPreviewText(state.planMessage, state)}
        </p>
        <TelegramButtons
          buttons={state.plans.map((item) => ({
            label: `${item.name || "Plano"} • ${formatPreviewPrice(item.priceCents)}`,
            onClick: () =>
              state.orderBumps.global.enabled
                ? onPhaseChange("order-bump")
                : onPhaseChange("pix"),
          }))}
        />
      </MessageBubble>
    ) : null;
  }

  if (phase === "pix") {
    const template = state.messages.pix_generated;

    return (
      <>
        <MessageBubble>
          <p className="whitespace-pre-wrap">
            {renderPreviewText(template.text || "Seu PIX foi gerado.", state)}
          </p>
          <div className="my-3 grid aspect-square place-items-center rounded-lg bg-white text-center text-xs font-bold text-black">
            QR CODE PIX
          </div>
          <TelegramButtons
            buttons={[
              { label: "Copiar PIX" },
              { label: "Verificar Pagamento", onClick: () => onPhaseChange("approved") },
            ]}
          />
        </MessageBubble>
      </>
    );
  }

  if (phase === "plans") {
    return (
      <>
        {ctaEnabled && cta?.action === "send_message" && cta.message ? (
          <MessageBubble>
            <p className="whitespace-pre-wrap">
              {renderPreviewText(cta.message, state)}
            </p>
          </MessageBubble>
        ) : null}
        {renderPlans()}
      </>
    );
  }

  if (phase === "approved") {
    const template = state.messages.payment_approved;

    return (
      <MessageBubble>
        <p className="whitespace-pre-wrap">
          {renderPreviewText(template.text || "Pagamento aprovado.", state)}
        </p>
        <TelegramButtons
          buttons={[{ label: "Acessar", onClick: () => onPhaseChange("delivery") }]}
        />
      </MessageBubble>
    );
  }

  if (phase === "delivery") {
    const delivery = state.deliveries[0];

    return (
      <MessageBubble>
        <p className="font-semibold">{delivery?.name || "Entrega"}</p>
        <p className="whitespace-pre-wrap">
          {renderPreviewText(delivery?.message || "Conteudo liberado.", state)}
        </p>
        {delivery?.file ? <MediaRenderer media={delivery.file} /> : null}
        <TelegramButtons
          buttons={[{ label: "Continuar", onClick: () => onPhaseChange("upsell") }]}
        />
      </MessageBubble>
    );
  }

  if (phase === "order-bump") {
    const bump = state.orderBumps.global;

    return (
      <MessageBubble>
        {offerMediaItems(state).map((media) =>
          media ? <MediaRenderer key={media.path} media={media} /> : null,
        )}
        <p className="font-semibold">{bump.title || "Oferta adicional"}</p>
        <p className="whitespace-pre-wrap">
          {renderPreviewText(bump.message || "Adicione esta oferta ao pedido.", state)}
        </p>
        <p className="mt-2 font-semibold text-sky-300">
          {formatPreviewPrice(bump.priceCents || 1990)}
        </p>
        <TelegramButtons
          columns={2}
          buttons={[
            {
              color: flowButtonColorHex(bump.acceptButtonColor || "auto"),
              label: bump.acceptButtonText || "✅ Quero aproveitar",
              onClick: () => onPhaseChange("pix"),
            },
            {
              color: flowButtonColorHex(bump.declineButtonColor || "auto"),
              label: bump.declineButtonText || "❌ Continuar sem bônus",
              onClick: () => onPhaseChange("pix"),
            },
          ]}
        />
      </MessageBubble>
    );
  }

  if (phase === "upsell") {
    return (
      <>
        {state.upsells.length ? state.upsells.map((upsell, index) => (
          <MessageBubble key={upsell.id}>
            {sequenceMediaItems(upsell).map((media) =>
              media ? <MediaRenderer key={media.path} media={media} /> : null,
            )}
            <p className="text-xs text-sky-300">Upsell {index + 1}</p>
            <p className="text-[10px] text-white/50">
              Delay: {upsell.delayValue ?? upsell.delayMinutes ?? 0}{" "}
              {upsell.delayUnit === "seconds" ? "segundos" : "minutos"}
            </p>
            <p className="whitespace-pre-wrap">
              {renderPreviewText(upsell.message || "Oferta especial para voce.", state)}
            </p>
            {upsell.exclusivePlans?.length ? (
              <div className="mt-2 grid gap-1">
                {upsell.exclusivePlans.map((plan) => (
                  <div key={plan.id} className="rounded-md bg-white/10 px-3 py-2 text-xs">
                    {plan.name} • {formatPreviewPrice(plan.priceCents)}
                  </div>
                ))}
              </div>
            ) : null}
            <TelegramButtons
              columns={upsell.required ? 1 : 2}
              buttons={[
                {
                  color: flowButtonColorHex(upsell.button.color ?? "auto"),
                  label: upsell.button.label || "✅ Quero aproveitar",
                },
                ...(!upsell.required
                  ? [{
                    color: flowButtonColorHex(upsell.declineButton?.color ?? "auto"),
                    label: upsell.declineButton?.label || "❌ Não quero",
                  }]
                  : []),
              ]}
            />
          </MessageBubble>
        )) : (
          <MessageBubble>Nenhum upsell configurado.</MessageBubble>
        )}
        <MessageBubble from="user">
          <button type="button" onClick={() => onPhaseChange("downsell")}>
            Continuar
          </button>
        </MessageBubble>
      </>
    );
  }

  if (phase === "downsell") {
    return (
      <>
        {state.downsells.length ? state.downsells.map((downsell, index) => (
          <MessageBubble key={downsell.id}>
            {downsell.image ? <MediaRenderer media={downsell.image} /> : null}
            <p className="text-xs text-sky-300">Downsell {index + 1}</p>
            <p className="whitespace-pre-wrap">
              {renderPreviewText(downsell.message || "Oferta alternativa.", state)}
            </p>
            <TelegramButtons
              buttons={[{ label: downsell.button.label || "Ver oferta" }]}
            />
          </MessageBubble>
        )) : (
          <MessageBubble>Nenhum downsell configurado.</MessageBubble>
        )}
      </>
    );
  }

  return (
    <>
      <MessageBubble>
        {initialMediaItems(state).map((media) =>
          media ? <MediaRenderer key={media.path} media={media} /> : null,
        )}
        <p className="whitespace-pre-wrap">
          {renderPreviewText(
            state.initialConfig.message || "Mensagem inicial do fluxo.",
            state,
          )}
        </p>
        <TelegramButtons
          buttons={
            ctaEnabled
              ? [
                  {
                    label: cta?.label || "Comecar Agora",
                    onClick: () => onPhaseChange("plans"),
                  },
                ]
              : []
          }
        />
      </MessageBubble>

      {ctaEnabled ? null : renderPlans()}
    </>
  );
});
