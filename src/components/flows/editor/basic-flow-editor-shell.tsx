"use client";

import { BasicEditorHeader } from "@/components/flows/editor/basic-editor-header";
import { FlowEditor } from "@/components/flows/editor/flow-editor";
import { PreviewStateProvider } from "@/components/flows/editor/preview-state";
import type { BasicFlowEditorData } from "@/server/services/flows";

type BasicFlowEditorShellProps = {
  flow: BasicFlowEditorData;
};

export function BasicFlowEditorShell({ flow }: BasicFlowEditorShellProps) {
  return (
    <PreviewStateProvider flow={flow}>
      <BasicEditorHeader flow={flow} />
      <FlowEditor flow={flow} />
    </PreviewStateProvider>
  );
}
