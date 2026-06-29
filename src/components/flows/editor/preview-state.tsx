"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

import { saveBasicFlowEditorAction } from "@/server/actions/flows";

import type {
  BasicFlowEditorData,
  FlowDelivery,
  FlowDownsellSequence,
  FlowInitialConfig,
  FlowMessagesConfig,
  FlowOrderBumps,
  FlowPlan,
  FlowPlanDefaultDelivery,
  FlowPlanPriceVariation,
  FlowPreviewBot,
  FlowUpsellSequence,
} from "@/server/services/flows";

export type PreviewStateValue = {
  bot: FlowPreviewBot | null;
  deliveries: FlowDelivery[];
  downsells: FlowDownsellSequence[];
  initialConfig: FlowInitialConfig;
  messages: FlowMessagesConfig;
  orderBumps: FlowOrderBumps;
  planDefaultDelivery: FlowPlanDefaultDelivery;
  planMessage: string;
  planPriceVariation: FlowPlanPriceVariation;
  plans: FlowPlan[];
  upsells: FlowUpsellSequence[];
};

type PreviewStateContextValue = PreviewStateValue & {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  lastSaveMessage: string;
  lastSaveStatus: "idle" | "success" | "error";
  saveAll: () => Promise<{ ok: boolean; message: string }>;
  setDeliveries: (deliveries: FlowDelivery[]) => void;
  setDownsells: (downsells: FlowDownsellSequence[]) => void;
  setInitialConfig: (config: FlowInitialConfig) => void;
  setMessages: (messages: FlowMessagesConfig) => void;
  setOrderBumps: (orderBumps: FlowOrderBumps) => void;
  setPlanDefaultDelivery: (delivery: FlowPlanDefaultDelivery) => void;
  setPlanMessage: (message: string) => void;
  setPlanPriceVariation: (variation: FlowPlanPriceVariation) => void;
  setPlans: (plans: FlowPlan[]) => void;
  setUpsells: (upsells: FlowUpsellSequence[]) => void;
};

const PreviewStateContext = createContext<PreviewStateContextValue | null>(null);

function stripSigned<T extends { signedUrl?: string | null }>(item: T) {
  const rest = { ...item };

  delete rest.signedUrl;
  return rest;
}

export function PreviewStateProvider({
  children,
  flow,
}: {
  children: React.ReactNode;
  flow: BasicFlowEditorData;
}) {
  const [initialConfig, setInitialConfig] = useState(flow.initialConfig);
  const [plans, setPlans] = useState(flow.plans);
  const [planMessage, setPlanMessage] = useState(flow.planMessage);
  const [deliveries, setDeliveries] = useState(flow.deliveries);
  const [orderBumps, setOrderBumps] = useState(flow.orderBumps);
  const [planDefaultDelivery, setPlanDefaultDelivery] = useState(
    flow.planDefaultDelivery,
  );
  const [planPriceVariation, setPlanPriceVariation] = useState(
    flow.planPriceVariation,
  );
  const [upsells, setUpsells] = useState(flow.upsells);
  const [downsells, setDownsells] = useState(flow.downsells);
  const [messages, setMessages] = useState(flow.messages);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveMessage, setLastSaveMessage] = useState("Tudo salvo");
  const [lastSaveStatus, setLastSaveStatus] =
    useState<"idle" | "success" | "error">("idle");

  const markDirty = useCallback(() => {
    setHasUnsavedChanges(true);
    setLastSaveMessage("Alteracoes nao salvas");
    setLastSaveStatus("idle");
  }, []);

  const updateInitialConfig = useCallback(
    (config: FlowInitialConfig) => {
      setInitialConfig(config);
      markDirty();
    },
    [markDirty],
  );
  const updatePlans = useCallback(
    (nextPlans: FlowPlan[]) => {
      setPlans(nextPlans);
      markDirty();
    },
    [markDirty],
  );
  const updatePlanDefaultDelivery = useCallback(
    (delivery: FlowPlanDefaultDelivery) => {
      setPlanDefaultDelivery(delivery);
      markDirty();
    },
    [markDirty],
  );
  const updatePlanMessage = useCallback(
    (message: string) => {
      setPlanMessage(message);
      markDirty();
    },
    [markDirty],
  );
  const updatePlanPriceVariation = useCallback(
    (variation: FlowPlanPriceVariation) => {
      setPlanPriceVariation(variation);
      markDirty();
    },
    [markDirty],
  );
  const updateDeliveries = useCallback(
    (nextDeliveries: FlowDelivery[]) => {
      setDeliveries(nextDeliveries);
      markDirty();
    },
    [markDirty],
  );
  const updateOrderBumps = useCallback(
    (nextOrderBumps: FlowOrderBumps) => {
      setOrderBumps(nextOrderBumps);
      markDirty();
    },
    [markDirty],
  );
  const updateUpsells = useCallback(
    (nextUpsells: FlowUpsellSequence[]) => {
      setUpsells(nextUpsells);
      markDirty();
    },
    [markDirty],
  );
  const updateDownsells = useCallback(
    (nextDownsells: FlowDownsellSequence[]) => {
      setDownsells(nextDownsells);
      markDirty();
    },
    [markDirty],
  );
  const updateMessages = useCallback(
    (nextMessages: FlowMessagesConfig) => {
      setMessages(nextMessages);
      markDirty();
    },
    [markDirty],
  );

  const saveAll = useCallback(async () => {
    setIsSaving(true);
    setLastSaveMessage("Salvando fluxo...");

    const payload = {
      initialConfig: {
        ...initialConfig,
        media: initialConfig.media
          ? {
              ...initialConfig.media,
              image: initialConfig.media.image
                ? stripSigned(initialConfig.media.image)
                : undefined,
              images: (initialConfig.media.images ?? []).map(stripSigned),
              video: initialConfig.media.video
                ? stripSigned(initialConfig.media.video)
                : null,
              audio: initialConfig.media.audio
                ? stripSigned(initialConfig.media.audio)
                : null,
            }
          : undefined,
      },
      plans: plans.map((plan) => ({
        ...plan,
        image: plan.image ? stripSigned(plan.image) : null,
      })),
      planMessage,
      planDefaultDelivery,
      planPriceVariation,
      deliveries: deliveries.map((delivery) => ({
        ...delivery,
        file: delivery.file ? stripSigned(delivery.file) : null,
      })),
      messages: Object.fromEntries(
        Object.entries(messages).map(([kind, template]) => [
          kind,
          {
            ...template,
            media: template.media.map(stripSigned),
          },
        ]),
      ),
      orderBumps: {
        global: {
          ...orderBumps.global,
          image: orderBumps.global.image
            ? stripSigned(orderBumps.global.image)
            : null,
        },
        individual: orderBumps.individual.map((offer) => ({
          ...offer,
          image: offer.image ? stripSigned(offer.image) : null,
        })),
      },
      upsells: upsells.map((upsell) => ({
        ...upsell,
        image: upsell.image ? stripSigned(upsell.image) : null,
      })),
      downsells: downsells.map((downsell) => ({
        ...downsell,
        image: downsell.image ? stripSigned(downsell.image) : null,
      })),
    };
    const result = await saveBasicFlowEditorAction(flow.id, payload);

    setIsSaving(false);
    setLastSaveMessage(result.message);
    setLastSaveStatus(result.ok ? "success" : "error");

    if (result.ok) {
      setHasUnsavedChanges(false);
    }

    return result;
  }, [
    deliveries,
    downsells,
    flow.id,
    initialConfig,
    messages,
    orderBumps,
    planDefaultDelivery,
    planMessage,
    planPriceVariation,
    plans,
    upsells,
  ]);

  const value = useMemo(
    () => ({
      bot: flow.previewBot,
      deliveries,
      downsells,
      hasUnsavedChanges,
      initialConfig,
      isSaving,
      lastSaveMessage,
      lastSaveStatus,
      messages,
      orderBumps,
      planDefaultDelivery,
      planMessage,
      planPriceVariation,
      plans,
      saveAll,
      setDeliveries: updateDeliveries,
      setDownsells: updateDownsells,
      setInitialConfig: updateInitialConfig,
      setMessages: updateMessages,
      setOrderBumps: updateOrderBumps,
      setPlanDefaultDelivery: updatePlanDefaultDelivery,
      setPlanMessage: updatePlanMessage,
      setPlanPriceVariation: updatePlanPriceVariation,
      setPlans: updatePlans,
      setUpsells: updateUpsells,
      upsells,
    }),
    [
      deliveries,
      downsells,
      flow.previewBot,
      hasUnsavedChanges,
      initialConfig,
      isSaving,
      lastSaveMessage,
      lastSaveStatus,
      messages,
      orderBumps,
      planDefaultDelivery,
      planMessage,
      planPriceVariation,
      plans,
      saveAll,
      updateDeliveries,
      updateDownsells,
      updateInitialConfig,
      updateMessages,
      updateOrderBumps,
      updatePlanDefaultDelivery,
      updatePlanMessage,
      updatePlanPriceVariation,
      updatePlans,
      updateUpsells,
      upsells,
    ],
  );

  return (
    <PreviewStateContext.Provider value={value}>
      {children}
    </PreviewStateContext.Provider>
  );
}

export function usePreviewState() {
  const context = useContext(PreviewStateContext);

  if (!context) {
    throw new Error("usePreviewState must be used inside PreviewStateProvider.");
  }

  return context;
}
