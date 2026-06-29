import type {
  RuntimeConfig,
  TelegramLeadContext,
} from "@/server/services/workflow-runtime/types";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function restoreAllowedTelegramTags(value: string) {
  return value
    .replaceAll("&lt;b&gt;", "<b>")
    .replaceAll("&lt;/b&gt;", "</b>")
    .replaceAll("&lt;i&gt;", "<i>")
    .replaceAll("&lt;/i&gt;", "</i>")
    .replaceAll("&lt;u&gt;", "<u>")
    .replaceAll("&lt;/u&gt;", "</u>")
    .replaceAll("&lt;s&gt;", "<s>")
    .replaceAll("&lt;/s&gt;", "</s>")
    .replaceAll("&lt;code&gt;", "<code>")
    .replaceAll("&lt;/code&gt;", "</code>");
}

export class VariableResolver {
  constructor(
    private readonly config: RuntimeConfig,
    private readonly lead: TelegramLeadContext,
  ) {}

  render(text?: string | null) {
    if (!text) return "";

    const variables: Record<string, string> = {
      "bot.name": this.config.bot.name,
      "bot.username": `@${this.config.bot.username}`,
      "lead.city": this.lead.city ?? "",
      "lead.email": this.lead.email ?? "",
      "lead.name": this.lead.firstName ?? "",
      "lead.phone": this.lead.phone ?? "",
      "lead.state": this.lead.state ?? "",
      nome: this.lead.firstName ?? "",
      nome_cliente: this.lead.firstName ?? "",
      username: this.lead.username ? `@${this.lead.username}` : "",
    };

    const rendered = text.replace(/\{\{([^}]+)\}\}/g, (_, key: string) => {
      return variables[key.trim()] ?? "";
    });

    return restoreAllowedTelegramTags(escapeHtml(rendered));
  }
}
