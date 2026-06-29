import { FlowList } from "@/components/flows/flow-list";
import { getFlowsOverview } from "@/server/services/flows";

export default async function FlowsPage() {
  const overview = await getFlowsOverview();

  return <FlowList overview={overview} />;
}
