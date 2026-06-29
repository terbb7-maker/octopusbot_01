export type DashboardPeriod = "today" | "yesterday" | "7d" | "30d" | "custom";

export type DashboardMetric = {
  label: string;
  value: string;
  helper: string;
};

export type PerformancePoint = {
  label: string;
  pixGerados: number;
  pixPagos: number;
  starts: number;
};

export type PeakPoint = {
  label: string;
  value: number;
};

export type DashboardData = {
  period: DashboardPeriod;
  updatedAt: string;
  workspaceId: string | null;
  hasWorkspace: boolean;
  summary: {
    pixPaidTodayCents: number;
    pixPaidYesterdayCents: number;
    pixPaidWeekCents: number;
    pixPaidMonthCents: number;
    pixPaidTotalCents: number;
    botStarts: number;
  };
  pixGenerated: {
    amountCents: number;
    yesterdayAmountCents: number;
    paidAmountCents: number;
    generatedCount: number;
    paidCount: number;
  };
  conversion: {
    currentRate: number;
    last7DaysRate: number;
    last30DaysRate: number;
    paidCount: number;
    startCount: number;
  };
  performance: PerformancePoint[];
  peakHours: PeakPoint[];
  peakDays: PeakPoint[];
  emptyStates: {
    hasPayments: boolean;
    hasPixCharges: boolean;
    hasTelegramStarts: boolean;
  };
};
