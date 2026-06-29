import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase/service-role";
import {
  type DashboardRangeOptions,
  formatBucketLabel,
  formatUpdatedAt,
  getDashboardRange,
  getMonthRange,
  getRelativeRange,
  getSaoPauloHour,
  getSaoPauloWeekday,
  getTodayRange,
  getWeekRange,
  getYesterdayRange,
  normalizePeriod,
} from "@/server/services/dashboard/date-range";
import type {
  DashboardData,
  DashboardPeriod,
  PeakPoint,
  PerformancePoint,
} from "@/server/services/dashboard/types";
import type { Json } from "@/types/database";

type PaymentRow = {
  amount_cents: number;
  status: string;
  approved_at: string | null;
  created_at: string;
};

type PixChargeRow = {
  status: string;
  paid_at: string | null;
  created_at: string;
  payment_id: string;
};

type TelegramEventRow = {
  event_type: string;
  payload: Json;
  created_at: string;
};

function isJsonRecord(
  value: unknown,
): value is { [key: string]: Json | undefined } {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function centsSum(rows: PaymentRow[]) {
  return rows.reduce((total, row) => total + row.amount_cents, 0);
}

function isWithin(dateValue: string | null, start: Date, end: Date) {
  if (!dateValue) {
    return false;
  }

  const date = new Date(dateValue);

  return date >= start && date < end;
}

function isStartEvent(event: TelegramEventRow) {
  const eventType = event.event_type.toLowerCase();

  if (eventType.includes("start")) {
    return true;
  }

  if (!isJsonRecord(event.payload)) {
    return false;
  }

  const message = event.payload.message;

  if (isJsonRecord(message) && message.text === "/start") {
    return true;
  }

  return false;
}

function conversionRate(paidCount: number, startCount: number) {
  if (startCount === 0) {
    return 0;
  }

  return Number(((paidCount / startCount) * 100).toFixed(1));
}

function buildBuckets(
  start: Date,
  end: Date,
  bucket: "hour" | "day",
  payments: PaymentRow[],
  pixCharges: PixChargeRow[],
  starts: TelegramEventRow[],
): PerformancePoint[] {
  const points: PerformancePoint[] = [];
  const cursor = new Date(start);

  while (cursor < end) {
    const next = new Date(cursor);

    if (bucket === "hour") {
      next.setUTCHours(next.getUTCHours() + 1);
    } else {
      next.setUTCDate(next.getUTCDate() + 1);
    }

    points.push({
      label: formatBucketLabel(cursor, bucket),
      pixGerados: pixCharges.filter((row) =>
        isWithin(row.created_at, cursor, next),
      ).length,
      pixPagos: payments.filter((row) =>
        isWithin(row.approved_at, cursor, next),
      ).length,
      starts: starts.filter((row) => isWithin(row.created_at, cursor, next))
        .length,
    });

    cursor.setTime(next.getTime());
  }

  return points;
}

function buildPeakHours(payments: PaymentRow[]): PeakPoint[] {
  const counts = new Map<number, number>();

  payments.forEach((payment) => {
    if (!payment.approved_at) {
      return;
    }

    const hour = getSaoPauloHour(payment.approved_at);
    counts.set(hour, (counts.get(hour) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([hour, value]) => ({
      label: `${String(hour).padStart(2, "0")}:00h/${String(hour + 1).padStart(
        2,
        "0",
      )}:00h`,
      value,
    }));
}

function buildPeakDays(payments: PaymentRow[]): PeakPoint[] {
  const counts = new Map<string, number>();

  payments.forEach((payment) => {
    if (!payment.approved_at) {
      return;
    }

    const weekday = getSaoPauloWeekday(payment.approved_at);
    counts.set(weekday, (counts.get(weekday) ?? 0) + 1);
  });

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([label, value]) => ({ label, value }));
}

async function getCurrentWorkspaceId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const admin = getSupabaseServiceRoleClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("default_workspace_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.default_workspace_id) {
    return profile.default_workspace_id;
  }

  const { data: membership } = await admin
    .from("workspace_members")
    .select("workspace_id")
    .eq("user_id", user.id)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  return membership?.workspace_id ?? null;
}

async function queryDashboardRows(
  workspaceId: string,
  period: DashboardPeriod,
  options: DashboardRangeOptions,
) {
  const admin = getSupabaseServiceRoleClient();
  const range = getDashboardRange(period, options);
  const monthRange = getMonthRange();
  const queryStart =
    monthRange.start < range.start ? monthRange.start : range.start;
  const queryEnd = monthRange.end > range.end ? monthRange.end : range.end;

  const [paymentsResult, pixResult, eventsResult, allPaidResult] =
    await Promise.all([
      admin
        .from("payments")
        .select("amount_cents,status,approved_at,created_at")
        .eq("workspace_id", workspaceId)
        .eq("environment", "production")
        .gte("created_at", queryStart.toISOString())
        .lt("created_at", queryEnd.toISOString()),
      admin
        .from("pix_charges")
        .select("status,paid_at,created_at,payment_id")
        .eq("workspace_id", workspaceId)
        .eq("environment", "production")
        .gte("created_at", queryStart.toISOString())
        .lt("created_at", queryEnd.toISOString()),
      admin
        .from("telegram_events")
        .select("event_type,payload,created_at")
        .eq("workspace_id", workspaceId)
        .gte("created_at", queryStart.toISOString())
        .lt("created_at", queryEnd.toISOString()),
      admin
        .from("payments")
        .select("amount_cents,status,approved_at,created_at")
        .eq("workspace_id", workspaceId)
        .eq("environment", "production")
        .eq("status", "approved"),
    ]);

  if (paymentsResult.error) {
    throw new Error(paymentsResult.error.message);
  }

  if (pixResult.error) {
    throw new Error(pixResult.error.message);
  }

  if (eventsResult.error) {
    throw new Error(eventsResult.error.message);
  }

  if (allPaidResult.error) {
    throw new Error(allPaidResult.error.message);
  }

  return {
    range,
    payments: (paymentsResult.data ?? []) as PaymentRow[],
    pixCharges: (pixResult.data ?? []) as PixChargeRow[],
    telegramStarts: ((eventsResult.data ?? []) as TelegramEventRow[]).filter(
      isStartEvent,
    ),
    allPaidPayments: (allPaidResult.data ?? []) as PaymentRow[],
  };
}

export async function getDashboardData(
  requestedPeriod?: string | null,
  options: DashboardRangeOptions = {},
): Promise<DashboardData> {
  const period = normalizePeriod(requestedPeriod);
  const workspaceId = await getCurrentWorkspaceId();

  if (!workspaceId) {
    return {
      period,
      updatedAt: formatUpdatedAt(),
      workspaceId: null,
      hasWorkspace: false,
      summary: {
        pixPaidTodayCents: 0,
        pixPaidYesterdayCents: 0,
        pixPaidWeekCents: 0,
        pixPaidMonthCents: 0,
        pixPaidTotalCents: 0,
        botStarts: 0,
      },
      pixGenerated: {
        amountCents: 0,
        yesterdayAmountCents: 0,
        paidAmountCents: 0,
        generatedCount: 0,
        paidCount: 0,
      },
      conversion: {
        currentRate: 0,
        last7DaysRate: 0,
        last30DaysRate: 0,
        paidCount: 0,
        startCount: 0,
      },
      performance: [],
      peakHours: [],
      peakDays: [],
      emptyStates: {
        hasPayments: false,
        hasPixCharges: false,
        hasTelegramStarts: false,
      },
    };
  }

  const { range, payments, pixCharges, telegramStarts, allPaidPayments } =
    await queryDashboardRows(workspaceId, period, options);
  const todayRange = getTodayRange();
  const yesterdayRange = getYesterdayRange();
  const weekRange = getWeekRange();
  const monthRange = getMonthRange();
  const last7Range = getRelativeRange(7);
  const last30Range = getRelativeRange(30);

  const approvedPayments = allPaidPayments;
  const currentApprovedPayments = allPaidPayments.filter((row) =>
    isWithin(row.approved_at, range.start, range.end),
  );
  const todayApprovedPayments = allPaidPayments.filter((row) =>
    isWithin(row.approved_at, todayRange.start, todayRange.end),
  );
  const yesterdayApprovedPayments = allPaidPayments.filter((row) =>
    isWithin(row.approved_at, yesterdayRange.start, yesterdayRange.end),
  );
  const weekApprovedPayments = allPaidPayments.filter((row) =>
    isWithin(row.approved_at, weekRange.start, weekRange.end),
  );
  const monthApprovedPayments = allPaidPayments.filter((row) =>
    isWithin(row.approved_at, monthRange.start, monthRange.end),
  );
  const currentGeneratedPayments = payments.filter((row) =>
    isWithin(row.created_at, range.start, range.end),
  );
  const currentPixCharges = pixCharges.filter((row) =>
    isWithin(row.created_at, range.start, range.end),
  );
  const yesterdayGeneratedPayments = payments.filter((row) =>
    isWithin(row.created_at, yesterdayRange.start, yesterdayRange.end),
  );
  const currentStarts = telegramStarts.filter((row) =>
    isWithin(row.created_at, range.start, range.end),
  );
  const last7Starts = telegramStarts.filter((row) =>
    isWithin(row.created_at, last7Range.start, last7Range.end),
  );
  const last30Starts = telegramStarts.filter((row) =>
    isWithin(row.created_at, last30Range.start, last30Range.end),
  );
  const last7Paid = allPaidPayments.filter((row) =>
    isWithin(row.approved_at, last7Range.start, last7Range.end),
  );
  const last30Paid = allPaidPayments.filter((row) =>
    isWithin(row.approved_at, last30Range.start, last30Range.end),
  );

  return {
    period,
    updatedAt: formatUpdatedAt(),
    workspaceId,
    hasWorkspace: true,
    summary: {
      pixPaidTodayCents: centsSum(todayApprovedPayments),
      pixPaidYesterdayCents: centsSum(yesterdayApprovedPayments),
      pixPaidWeekCents: centsSum(weekApprovedPayments),
      pixPaidMonthCents: centsSum(monthApprovedPayments),
      pixPaidTotalCents: centsSum(allPaidPayments),
      botStarts: currentStarts.length,
    },
    pixGenerated: {
      amountCents: centsSum(currentGeneratedPayments),
      yesterdayAmountCents: centsSum(yesterdayGeneratedPayments),
      paidAmountCents: centsSum(currentApprovedPayments),
      generatedCount: currentPixCharges.length,
      paidCount: currentPixCharges.filter((row) => row.status === "paid").length,
    },
    conversion: {
      currentRate: conversionRate(
        currentApprovedPayments.length,
        currentStarts.length,
      ),
      last7DaysRate: conversionRate(last7Paid.length, last7Starts.length),
      last30DaysRate: conversionRate(last30Paid.length, last30Starts.length),
      paidCount: currentApprovedPayments.length,
      startCount: currentStarts.length,
    },
    performance: buildBuckets(
      range.start,
      range.end,
      range.bucket,
      approvedPayments,
      currentPixCharges,
      currentStarts,
    ),
    peakHours: buildPeakHours(currentApprovedPayments),
    peakDays: buildPeakDays(currentApprovedPayments),
    emptyStates: {
      hasPayments: allPaidPayments.length > 0,
      hasPixCharges: pixCharges.length > 0,
      hasTelegramStarts: telegramStarts.length > 0,
    },
  };
}
