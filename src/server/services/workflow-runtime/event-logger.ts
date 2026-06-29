import type {
  RuntimeEventType,
  RuntimeSession,
  RuntimeSupabase,
} from "@/server/services/workflow-runtime/types";
import { toJson } from "@/server/services/workflow-runtime/types";

export class EventLogger {
  constructor(private readonly supabase: RuntimeSupabase) {}

  async log(
    session: Pick<RuntimeSession, "id" | "workspace_id">,
    eventType: RuntimeEventType,
    payload: Record<string, unknown> = {},
  ) {
    await this.supabase.from("flow_events").insert({
      event_type: eventType,
      payload: toJson(payload),
      session_id: session.id,
      workspace_id: session.workspace_id,
    });

    await this.supabase
      .from("flow_sessions")
      .update({
        last_event_at: new Date().toISOString(),
        last_interaction_at: new Date().toISOString(),
      })
      .eq("id", session.id)
      .eq("workspace_id", session.workspace_id);
  }
}
