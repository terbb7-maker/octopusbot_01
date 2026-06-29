import type { PreviewStateValue } from "@/components/flows/editor/preview-state";

export const previewSimulationData = {
  bot: {
    name: "OctopusBot",
    username: "octopusbot",
  },
  lead: {
    city: "Sao Paulo",
    email: "pedro@email.com",
    name: "Pedro",
    phone: "(11) 99999-9999",
    state: "SP",
  },
  payment: {
    pixCode: "00020126580014BR.GOV.BCB.PIX0136OCTOPUSBOT520400005303986540519.905802BR5920OCTOPUSBOT6009SAO PAULO",
    qrCode: "PIX QR",
  },
};

function formatPrice(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    currency: "BRL",
    style: "currency",
  }).format(cents / 100);
}

export function firstPlanPreview(state: PreviewStateValue) {
  return state.plans[0] ?? null;
}

export function renderPreviewText(text: string, state: PreviewStateValue) {
  const plan = firstPlanPreview(state);
  const bot = state.bot ?? previewSimulationData.bot;
  const values: Record<string, string> = {
    "bot.name": bot.name,
    "bot.username": `@${bot.username}`,
    "lead.city": previewSimulationData.lead.city,
    "lead.email": previewSimulationData.lead.email,
    "lead.name": previewSimulationData.lead.name,
    "lead.phone": previewSimulationData.lead.phone,
    "lead.state": previewSimulationData.lead.state,
    plano: plan?.name ?? "VIP Premium",
    valor: formatPrice(plan?.priceCents ?? 1990),
  };

  return text.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
    return values[key.trim()] ?? "";
  });
}

export function formatPreviewPrice(cents: number) {
  return formatPrice(cents);
}
