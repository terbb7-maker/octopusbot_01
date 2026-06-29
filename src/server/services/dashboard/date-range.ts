import type { DashboardPeriod } from "@/server/services/dashboard/types";

const SAO_PAULO_TIME_ZONE = "America/Sao_Paulo";
const SAO_PAULO_OFFSET = "-03:00";

export type DashboardRangeOptions = {
  customFrom?: string | null;
  customTo?: string | null;
};

function getSaoPauloDateString(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SAO_PAULO_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function startOfSaoPauloDay(date: Date) {
  return new Date(`${getSaoPauloDateString(date)}T00:00:00${SAO_PAULO_OFFSET}`);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);

  return next;
}

function parseSaoPauloDate(date?: string | null) {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return null;
  }

  const parsedDate = new Date(`${date}T00:00:00${SAO_PAULO_OFFSET}`);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

export function normalizePeriod(period?: string | null): DashboardPeriod {
  if (
    period === "today" ||
    period === "yesterday" ||
    period === "7d" ||
    period === "30d" ||
    period === "custom"
  ) {
    return period;
  }

  return "today";
}

export function getDashboardRange(
  period: DashboardPeriod,
  options: DashboardRangeOptions = {},
) {
  const now = new Date();
  const todayStart = startOfSaoPauloDay(now);

  if (period === "custom") {
    const start = parseSaoPauloDate(options.customFrom);
    const endDate = parseSaoPauloDate(options.customTo);
    const end = endDate ? addDays(endDate, 1) : null;

    if (start && end && end > start) {
      const durationInDays = Math.ceil(
        (end.getTime() - start.getTime()) / 86_400_000,
      );

      return {
        start,
        end,
        bucket: durationInDays <= 2 ? ("hour" as const) : ("day" as const),
      };
    }
  }

  if (period === "yesterday") {
    const start = addDays(todayStart, -1);

    return {
      start,
      end: todayStart,
      bucket: "hour" as const,
    };
  }

  if (period === "7d") {
    return {
      start: addDays(todayStart, -6),
      end: addDays(todayStart, 1),
      bucket: "day" as const,
    };
  }

  if (period === "30d") {
    return {
      start: addDays(todayStart, -29),
      end: addDays(todayStart, 1),
      bucket: "day" as const,
    };
  }

  return {
    start: todayStart,
    end: addDays(todayStart, 1),
    bucket: "hour" as const,
  };
}

export function getRelativeRange(days: number) {
  const now = new Date();
  const todayStart = startOfSaoPauloDay(now);

  return {
    start: addDays(todayStart, -(days - 1)),
    end: addDays(todayStart, 1),
  };
}

export function getTodayRange() {
  return getDashboardRange("today");
}

export function getYesterdayRange() {
  return getDashboardRange("yesterday");
}

export function getMonthRange() {
  return getRelativeRange(30);
}

export function getWeekRange() {
  return getRelativeRange(7);
}

export function formatUpdatedAt(date = new Date()) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: SAO_PAULO_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(date);
}

export function formatBucketLabel(date: Date, bucket: "hour" | "day") {
  if (bucket === "hour") {
    return new Intl.DateTimeFormat("pt-BR", {
      timeZone: SAO_PAULO_TIME_ZONE,
      hour: "2-digit",
    }).format(date);
  }

  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: SAO_PAULO_TIME_ZONE,
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

export function getSaoPauloHour(date: string) {
  return Number(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: SAO_PAULO_TIME_ZONE,
      hour: "2-digit",
      hour12: false,
    }).format(new Date(date)),
  );
}

export function getSaoPauloWeekday(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: SAO_PAULO_TIME_ZONE,
    weekday: "long",
  }).format(new Date(date));
}
