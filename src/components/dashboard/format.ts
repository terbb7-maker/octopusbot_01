export function formatCurrencyFromCents(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

export function formatInteger(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatPercent(value: number) {
  return `${new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value)}%`;
}

export function formatDelta(current: number, previous: number) {
  if (current === 0 && previous === 0) {
    return "0,0%";
  }

  if (previous === 0) {
    return "+100,0%";
  }

  const delta = ((current - previous) / previous) * 100;
  const prefix = delta > 0 ? "+" : "";

  return `${prefix}${formatPercent(delta)}`;
}
