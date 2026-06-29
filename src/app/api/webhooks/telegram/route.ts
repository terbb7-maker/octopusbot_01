import { NextResponse } from "next/server";

import { createTelegramWebhookResult } from "@/lib/telegram";

export async function POST() {
  return NextResponse.json(createTelegramWebhookResult(), { status: 202 });
}
