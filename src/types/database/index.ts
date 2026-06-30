import type {
  PaymentEventsTable,
  PaymentsTable,
  PixChargesTable,
  WorkspacePaymentSettingsTable,
} from "@/types/database/commerce-tables";
import type {
  ProfilesTable,
  WorkspaceMembersTable,
  WorkspacesTable,
} from "@/types/database/identity-tables";
import type {
  FlowCheckoutsTable,
  FlowDeploymentVariantsTable,
  FlowDeploymentsTable,
  FlowDefaultDeliveriesTable,
  FlowEventsTable,
  FlowBotBindingsTable,
  FlowPlanPriceVariationsTable,
  FlowPlansTable,
  FlowSessionsTable,
  FlowUpsellSequenceMediaTable,
  FlowUpsellSequencePlansTable,
  FlowUpsellSequencesTable,
  FlowsTable,
  FlowVersionsTable,
} from "@/types/database/flow-tables";
import type {
  TelegramBotsTable,
  TelegramChatsTable,
  TelegramEventsTable,
} from "@/types/database/telegram-tables";
import type {
  AuditLogsTable,
  WebhookInboxTable,
} from "@/types/database/system-tables";

export type { Json } from "@/types/database/json";

export type Database = {
  public: {
    Tables: {
      profiles: ProfilesTable;
      workspaces: WorkspacesTable;
      workspace_members: WorkspaceMembersTable;
      telegram_bots: TelegramBotsTable;
      telegram_chats: TelegramChatsTable;
      telegram_events: TelegramEventsTable;
      payments: PaymentsTable;
      pix_charges: PixChargesTable;
      payment_events: PaymentEventsTable;
      workspace_payment_settings: WorkspacePaymentSettingsTable;
      flows: FlowsTable;
      flow_versions: FlowVersionsTable;
      flow_bot_bindings: FlowBotBindingsTable;
      flow_deployments: FlowDeploymentsTable;
      flow_deployment_variants: FlowDeploymentVariantsTable;
      flow_plans: FlowPlansTable;
      flow_default_deliveries: FlowDefaultDeliveriesTable;
      flow_plan_price_variations: FlowPlanPriceVariationsTable;
      flow_upsell_sequences: FlowUpsellSequencesTable;
      flow_upsell_sequence_plans: FlowUpsellSequencePlansTable;
      flow_upsell_sequence_media: FlowUpsellSequenceMediaTable;
      flow_sessions: FlowSessionsTable;
      flow_events: FlowEventsTable;
      flow_checkouts: FlowCheckoutsTable;
      audit_logs: AuditLogsTable;
      webhook_inbox: WebhookInboxTable;
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      workspace_member_role: "owner" | "admin" | "member" | "viewer";
      workspace_member_status: "active" | "invited" | "removed";
      workspace_status: "active" | "suspended" | "archived";
      telegram_bot_status: "active" | "disabled" | "revoked";
      telegram_webhook_status: "pending" | "active" | "failed" | "disabled";
      flow_status: "draft" | "active" | "paused" | "archived";
      flow_version_status: "draft" | "published" | "deprecated" | "archived";
      flow_binding_status: "active" | "paused" | "archived";
      flow_deployment_status: "active" | "paused" | "retired";
      flow_deployment_strategy: "single" | "ab_test" | "rollout";
      flow_offer_delay_unit: "seconds" | "minutes";
      flow_offer_delivery_type:
        | "telegram_group"
        | "telegram_channel"
        | "link"
        | "custom_message"
        | "exclusive_plans";
      flow_offer_button_color: "auto" | "blue" | "green" | "red";
      flow_offer_order_bump_mode: "none" | "global" | "exclusive";
      payment_environment: "production" | "sandbox";
      payment_gateway_provider:
        | "sandbox"
        | "pushinpay"
        | "bspay"
        | "gothampay"
        | "ativopay"
        | "woovi";
      sandbox_payment_result: "always_approve" | "always_pending";
    };
    CompositeTypes: Record<string, never>;
  };
};
