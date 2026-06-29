import { ConversionCard } from "@/components/dashboard/conversion-card";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { PeakMetricCard } from "@/components/dashboard/peak-metric-card";
import { PerformanceChartCard } from "@/components/dashboard/performance-chart-card";
import { PixGeneratedCard } from "@/components/dashboard/pix-generated-card";
import { PixPaidSummaryCard } from "@/components/dashboard/pix-paid-summary-card";
import { getDashboardData } from "@/server/services/dashboard";

type DashboardPageProps = {
  searchParams?: Promise<{
    from?: string;
    period?: string;
    to?: string;
  }>;
};

function buildRefreshHref({
  period,
  from,
  to,
}: {
  period?: string;
  from?: string;
  to?: string;
}) {
  const params = new URLSearchParams();

  if (period && period !== "today") {
    params.set("period", period);
  }

  if (period === "custom") {
    if (from) {
      params.set("from", from);
    }

    if (to) {
      params.set("to", to);
    }
  }

  const queryString = params.toString();

  return queryString ? `/dashboard?${queryString}` : "/dashboard";
}

export default async function DashboardPage({
  searchParams,
}: DashboardPageProps) {
  const params = await searchParams;
  const dashboard = await getDashboardData(params?.period, {
    customFrom: params?.from,
    customTo: params?.to,
  });
  const hasActivityData =
    dashboard.emptyStates.hasPayments ||
    dashboard.emptyStates.hasPixCharges ||
    dashboard.emptyStates.hasTelegramStarts;
  const hasConversionData =
    dashboard.emptyStates.hasPayments && dashboard.emptyStates.hasTelegramStarts;

  return (
    <div className="mx-auto flex w-full max-w-[1680px] flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
      <DashboardHeader
        period={dashboard.period}
        updatedAt={dashboard.updatedAt}
        customFrom={params?.from}
        customTo={params?.to}
        refreshHref={buildRefreshHref({
          period: dashboard.period,
          from: params?.from,
          to: params?.to,
        })}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,2.05fr)_minmax(360px,0.95fr)]">
        <PixPaidSummaryCard
          summary={dashboard.summary}
          hasData={
            dashboard.emptyStates.hasPayments ||
            dashboard.emptyStates.hasTelegramStarts
          }
        />
        <PixGeneratedCard
          pixGenerated={dashboard.pixGenerated}
          hasData={dashboard.emptyStates.hasPixCharges}
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-[minmax(0,1.35fr)_minmax(260px,0.8fr)_minmax(260px,0.9fr)_minmax(260px,0.9fr)]">
        <PerformanceChartCard
          data={dashboard.performance}
          hasData={hasActivityData}
        />
        <ConversionCard
          conversion={dashboard.conversion}
          hasData={hasConversionData}
        />
        <PeakMetricCard
          title="Horarios de pico"
          description="Faixas com mais PIX pagos."
          icon="clock"
          data={dashboard.peakHours}
        />
        <PeakMetricCard
          title="Dias de pico"
          description="Dias com melhor volume de pagamentos."
          icon="calendar"
          data={dashboard.peakDays}
        />
      </section>
    </div>
  );
}
