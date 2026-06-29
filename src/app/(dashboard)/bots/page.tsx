import { BotList } from "@/components/bots/bot-list";
import { getBotsOverview } from "@/server/services/bots";

export default async function BotsPage() {
  const overview = await getBotsOverview();

  return <BotList overview={overview} />;
}
