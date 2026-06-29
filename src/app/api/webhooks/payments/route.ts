import { NextResponse } from "next/server";

import { createPaymentWebhookResult } from "@/lib/payments";

export async function POST() {
  return NextResponse.json(createPaymentWebhookResult(), { status: 202 });
}
