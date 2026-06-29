import type {
  RuntimeConfig,
  RuntimeSession,
  RuntimeSupabase,
  TelegramLeadContext,
} from "@/server/services/workflow-runtime/types";
import { toJson } from "@/server/services/workflow-runtime/types";

export class ConversationRuntime {
  constructor(private readonly supabase: RuntimeSupabase) {}

  async loadLeadContext(input: {
    botId: string;
    chatExternalId: number;
    fallback: TelegramLeadContext;
    workspaceId: string;
  }): Promise<TelegramLeadContext> {
    const { data } = await this.supabase
      .from("telegram_chats")
      .select("id,first_name,last_name,username,email,phone,city,state,language_code,telegram_user_external_id")
      .eq("workspace_id", input.workspaceId)
      .eq("telegram_bot_id", input.botId)
      .eq("telegram_chat_external_id", input.chatExternalId)
      .maybeSingle();

    return {
      ...input.fallback,
      chatId: data?.id ?? input.fallback.chatId ?? null,
      city: data?.city ?? "",
      email: data?.email ?? "",
      firstName: data?.first_name ?? input.fallback.firstName ?? "",
      languageCode: data?.language_code ?? input.fallback.languageCode ?? "",
      lastName: data?.last_name ?? input.fallback.lastName ?? "",
      phone: data?.phone ?? "",
      state: data?.state ?? "",
      telegramUserExternalId:
        data?.telegram_user_external_id
        ?? input.fallback.telegramUserExternalId
        ?? null,
      username: data?.username ?? input.fallback.username ?? "",
    };
  }

  async startSession(config: RuntimeConfig, lead: TelegramLeadContext) {
    if (lead.chatId) {
      await this.supabase
        .from("flow_sessions")
        .update({
          conversation_status: "abandoned",
          ended_at: new Date().toISOString(),
          status: "abandoned",
        })
        .eq("workspace_id", config.workspaceId)
        .eq("telegram_bot_id", config.bot.id)
        .eq("telegram_chat_id", lead.chatId)
        .eq("status", "active");
    }

    const { data, error } = await this.supabase
      .from("flow_sessions")
      .insert({
        context: toJson({ startedBy: "telegram_start" }),
        conversation_status: "active",
        current_node_key: "initial",
        current_step: "initial",
        deployment_id: config.deploymentId,
        flow_id: config.flowId,
        flow_version_id: config.versionId,
        last_event_at: new Date().toISOString(),
        lead_id: lead.chatId,
        session_key: crypto.randomUUID(),
        status: "active",
        telegram_bot_id: config.bot.id,
        telegram_chat_external_id: lead.chatExternalId,
        telegram_chat_id: lead.chatId,
        telegram_user_external_id: lead.telegramUserExternalId,
        variant_id: config.variantId,
        workspace_id: config.workspaceId,
      })
      .select("*")
      .single();

    if (error || !data) {
      throw new Error("Nao foi possivel iniciar a conversa.");
    }

    return data as RuntimeSession;
  }

  async loadActiveSession(input: {
    botId: string;
    chatExternalId: number;
    workspaceId: string;
  }) {
    const { data } = await this.supabase
      .from("flow_sessions")
      .select("*")
      .eq("workspace_id", input.workspaceId)
      .eq("telegram_bot_id", input.botId)
      .eq("telegram_chat_external_id", input.chatExternalId)
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    return (data ?? null) as RuntimeSession | null;
  }

  async updateSession(
    session: Pick<RuntimeSession, "id" | "workspace_id">,
    values: Partial<RuntimeSession>,
  ) {
    const { data, error } = await this.supabase
      .from("flow_sessions")
      .update({
        ...values,
        last_interaction_at: new Date().toISOString(),
      })
      .eq("id", session.id)
      .eq("workspace_id", session.workspace_id)
      .select("*")
      .single();

    if (error || !data) throw new Error("Nao foi possivel atualizar a conversa.");

    return data as RuntimeSession;
  }
}
