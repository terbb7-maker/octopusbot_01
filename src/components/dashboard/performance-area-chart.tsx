"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import type { PerformancePoint } from "@/server/services/dashboard/types";

type PerformanceAreaChartProps = {
  data: PerformancePoint[];
};

type TooltipPayload = {
  color?: string;
  name?: string;
  value?: number;
};

export function PerformanceAreaChart({ data }: PerformanceAreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={data}
        margin={{ top: 10, right: 10, left: -24, bottom: 0 }}
        accessibilityLayer
      >
        <defs>
          <linearGradient id="startsGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.38} />
            <stop offset="95%" stopColor="#a855f7" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="paidGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#34d399" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="generatedGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.24} />
            <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid
          stroke="rgba(255,255,255,0.08)"
          vertical={false}
          strokeDasharray="4 8"
        />
        <XAxis
          dataKey="label"
          axisLine={false}
          tickLine={false}
          minTickGap={18}
          tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11 }}
        />
        <YAxis
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
          tick={{ fill: "rgba(255,255,255,0.42)", fontSize: 11 }}
        />
        <Tooltip content={<PerformanceTooltip />} />
        <Area
          type="monotone"
          dataKey="starts"
          name="Starts"
          stroke="#a855f7"
          fill="url(#startsGradient)"
          strokeWidth={2}
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="pixGerados"
          name="PIX gerados"
          stroke="#f59e0b"
          fill="url(#generatedGradient)"
          strokeWidth={2}
          dot={false}
        />
        <Area
          type="monotone"
          dataKey="pixPagos"
          name="PIX pagos"
          stroke="#34d399"
          fill="url(#paidGradient)"
          strokeWidth={2}
          dot={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function PerformanceTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-md border border-white/10 bg-[#101014]/95 px-3 py-2 text-xs shadow-2xl shadow-black/40">
      <p className="mb-2 font-semibold text-foreground">{label}</p>
      <div className="space-y-1.5">
        {payload.map((item) => (
          <div
            key={item.name}
            className="flex min-w-36 items-center justify-between gap-4"
          >
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                className="size-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              {item.name}
            </span>
            <span className="font-semibold text-foreground">
              {item.value ?? 0}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
