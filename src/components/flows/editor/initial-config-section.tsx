"use client";

import { InitialMessageCard } from "@/components/flows/editor/initial-message-card";
import { usePreviewState } from "@/components/flows/editor/preview-state";
import type { BasicFlowEditorData } from "@/server/services/flows";

type InitialConfigSectionProps = {
  flow: BasicFlowEditorData;
};

export function InitialConfigSection({ flow }: InitialConfigSectionProps) {
  const { initialConfig, setInitialConfig } = usePreviewState();

  return (
    <InitialMessageCard
      config={initialConfig}
      flowId={flow.id}
      onChange={setInitialConfig}
    />
  );
}
