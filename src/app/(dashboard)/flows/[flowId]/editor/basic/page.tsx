import { notFound } from "next/navigation";

import { BasicFlowEditorShell } from "@/components/flows/editor/basic-flow-editor-shell";
import { getBasicFlowEditorData } from "@/server/services/flows";

type BasicFlowEditorPageProps = {
  params: Promise<{
    flowId: string;
  }>;
};

export default async function BasicFlowEditorPage({
  params,
}: BasicFlowEditorPageProps) {
  const { flowId } = await params;
  const flow = await getBasicFlowEditorData(flowId);

  if (!flow) notFound();

  return <BasicFlowEditorShell flow={flow} />;
}
