import type { Json } from "@/types/database/json";
import type {
  PaymentEnvironment,
  PaymentGatewayProvider,
} from "@/types/database/commerce-tables";

export type FlowStatus = "draft" | "active" | "paused" | "archived";
export type FlowVersionStatus = "draft" | "published" | "deprecated" | "archived";
export type FlowBindingStatus = "active" | "paused" | "archived";
export type FlowDeploymentStatus = "active" | "paused" | "retired";
export type FlowDeploymentStrategy = "single" | "ab_test" | "rollout";
export type FlowSessionStatus =
  | "active"
  | "completed"
  | "abandoned"
  | "failed"
  | "cancelled";
export type FlowConversationStatus =
  | "active"
  | "waiting_payment"
  | "paid"
  | "completed"
  | "abandoned"
  | "expired"
  | "failed";
export type FlowCheckoutStatus =
  | "draft"
  | "payment_created"
  | "paid"
  | "expired"
  | "cancelled"
  | "failed";
export type FlowPlanBillingType =
  | "lifetime"
  | "monthly"
  | "quarterly"
  | "semiannual"
  | "annual";
export type FlowPlanButtonColor = "default" | "blue" | "green" | "red";
export type FlowPlanDeliveryType =
  | "default"
  | "telegram_group"
  | "telegram_channel"
  | "link"
  | "custom_message";
export type FlowOfferDelayUnit = "seconds" | "minutes";
export type FlowOfferDeliveryType = Exclude<FlowPlanDeliveryType, "default"> | "exclusive_plans";
export type FlowOfferButtonColor = "auto" | "blue" | "green" | "red";
export type FlowOfferOrderBumpMode = "none" | "global" | "exclusive";

export type FlowsTable = {
  Row: {
    id: string;
    workspace_id: string;
    name: string;
    description: string | null;
    status: FlowStatus;
    active_version_id: string | null;
    created_by: string | null;
    updated_by: string | null;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    workspace_id: string;
    name: string;
    description?: string | null;
    status?: FlowStatus;
    active_version_id?: string | null;
    created_by?: string | null;
    updated_by?: string | null;
    deleted_at?: string | null;
  };
  Update: {
    name?: string;
    description?: string | null;
    status?: FlowStatus;
    active_version_id?: string | null;
    updated_by?: string | null;
    deleted_at?: string | null;
  };
  Relationships: [];
};

export type FlowVersionsTable = {
  Row: {
    id: string;
    workspace_id: string;
    flow_id: string;
    version_number: number;
    status: FlowVersionStatus;
    graph_json: Json;
    compiled_graph_json: Json;
    cta_enabled: boolean;
    cta_label: string | null;
    cta_action: "show_plans" | "open_link" | "send_message";
    cta_url: string | null;
    cta_message: string | null;
    order_bump_accept_button_text: string | null;
    order_bump_accept_button_color: "auto" | "blue" | "green" | "red";
    order_bump_decline_button_text: string | null;
    order_bump_decline_button_color: "auto" | "blue" | "green" | "red";
    order_bump_media_type: "image" | "video" | "audio" | null;
    order_bump_media_group: boolean;
    order_bump_delivery_type: FlowPlanDeliveryType | null;
    order_bump_delivery_chat_id: number | null;
    order_bump_delivery_url: string | null;
    order_bump_delivery_message: string | null;
    updated_at: string;
    created_at: string;
  };
  Insert: {
    workspace_id: string;
    flow_id: string;
    version_number: number;
    status?: FlowVersionStatus;
    graph_schema_version?: number;
    graph_json?: Json;
    compiled_graph_json?: Json;
    cta_enabled?: boolean;
    cta_label?: string | null;
    cta_action?: "show_plans" | "open_link" | "send_message";
    cta_url?: string | null;
    cta_message?: string | null;
    order_bump_accept_button_text?: string | null;
    order_bump_accept_button_color?: "auto" | "blue" | "green" | "red";
    order_bump_decline_button_text?: string | null;
    order_bump_decline_button_color?: "auto" | "blue" | "green" | "red";
    order_bump_media_type?: "image" | "video" | "audio" | null;
    order_bump_media_group?: boolean;
    order_bump_delivery_type?: FlowPlanDeliveryType | null;
    order_bump_delivery_chat_id?: number | null;
    order_bump_delivery_url?: string | null;
    order_bump_delivery_message?: string | null;
    validation_status?: "pending" | "valid" | "invalid";
    validation_errors?: Json;
    checksum?: string | null;
    parent_version_id?: string | null;
    created_by?: string | null;
    published_by?: string | null;
    published_at?: string | null;
  };
  Update: {
    graph_json?: Json;
    compiled_graph_json?: Json;
    cta_enabled?: boolean;
    cta_label?: string | null;
    cta_action?: "show_plans" | "open_link" | "send_message";
    cta_url?: string | null;
    cta_message?: string | null;
    order_bump_accept_button_text?: string | null;
    order_bump_accept_button_color?: "auto" | "blue" | "green" | "red";
    order_bump_decline_button_text?: string | null;
    order_bump_decline_button_color?: "auto" | "blue" | "green" | "red";
    order_bump_media_type?: "image" | "video" | "audio" | null;
    order_bump_media_group?: boolean;
    order_bump_delivery_type?: FlowPlanDeliveryType | null;
    order_bump_delivery_chat_id?: number | null;
    order_bump_delivery_url?: string | null;
    order_bump_delivery_message?: string | null;
    validation_status?: "pending" | "valid" | "invalid";
    validation_errors?: Json;
    checksum?: string | null;
    published_by?: string | null;
    published_at?: string | null;
    status?: FlowVersionStatus;
  };
  Relationships: [];
};

export type FlowBotBindingsTable = {
  Row: {
    id: string;
    workspace_id: string;
    telegram_bot_id: string;
    flow_id: string;
    status: FlowBindingStatus;
    entrypoint: string;
    trigger_config: Json;
    created_by: string | null;
    updated_by: string | null;
    deleted_at: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    workspace_id: string;
    telegram_bot_id: string;
    flow_id: string;
    status?: FlowBindingStatus;
    entrypoint?: string;
    trigger_config?: Json;
    created_by?: string | null;
    updated_by?: string | null;
    deleted_at?: string | null;
  };
  Update: {
    flow_id?: string;
    status?: FlowBindingStatus;
    entrypoint?: string;
    trigger_config?: Json;
    updated_by?: string | null;
    deleted_at?: string | null;
  };
  Relationships: [];
};

export type FlowDeploymentsTable = {
  Row: {
    id: string;
    workspace_id: string;
    binding_id: string;
    flow_id: string;
    status: FlowDeploymentStatus;
    strategy: FlowDeploymentStrategy;
    activated_at: string | null;
    retired_at: string | null;
    created_by: string | null;
    metadata: Json;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    workspace_id: string;
    binding_id: string;
    flow_id: string;
    status?: FlowDeploymentStatus;
    strategy?: FlowDeploymentStrategy;
    activated_at?: string | null;
    retired_at?: string | null;
    created_by?: string | null;
    metadata?: Json;
  };
  Update: Partial<Omit<FlowDeploymentsTable["Insert"], "workspace_id" | "binding_id" | "flow_id">>;
  Relationships: [];
};

export type FlowDeploymentVariantsTable = {
  Row: {
    id: string;
    workspace_id: string;
    deployment_id: string;
    flow_id: string;
    flow_version_id: string;
    name: string;
    weight_basis_points: number;
    is_control: boolean;
    created_at: string;
  };
  Insert: {
    workspace_id: string;
    deployment_id: string;
    flow_id: string;
    flow_version_id: string;
    name: string;
    weight_basis_points?: number;
    is_control?: boolean;
  };
  Update: Partial<Omit<FlowDeploymentVariantsTable["Insert"], "workspace_id" | "deployment_id" | "flow_id">>;
  Relationships: [];
};

export type FlowPlansTable = {
  Row: {
    id: string;
    workspace_id: string;
    flow_id: string;
    order_index: number;
    name: string;
    price_cents: number;
    billing_type: FlowPlanBillingType;
    button_color: FlowPlanButtonColor;
    button_text: string;
    image_name: string | null;
    image_path: string | null;
    image_type: string | null;
    delivery_type: FlowPlanDeliveryType;
    telegram_destination_id: string | null;
    delivery_url: string | null;
    delivery_message: string | null;
    use_default_delivery: boolean;
    use_global_order_bump: boolean;
    order_bump_id: string | null;
    active: boolean;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    workspace_id: string;
    flow_id: string;
    order_index?: number;
    name?: string;
    price_cents?: number;
    billing_type?: FlowPlanBillingType;
    button_color?: FlowPlanButtonColor;
    button_text?: string;
    image_name?: string | null;
    image_path?: string | null;
    image_type?: string | null;
    delivery_type?: FlowPlanDeliveryType;
    telegram_destination_id?: string | null;
    delivery_url?: string | null;
    delivery_message?: string | null;
    use_default_delivery?: boolean;
    use_global_order_bump?: boolean;
    order_bump_id?: string | null;
    active?: boolean;
  };
  Update: Partial<Omit<FlowPlansTable["Insert"], "workspace_id" | "flow_id">>;
  Relationships: [];
};

export type FlowDefaultDeliveriesTable = {
  Row: {
    id: string;
    workspace_id: string;
    flow_id: string;
    delivery_type: Exclude<FlowPlanDeliveryType, "default">;
    telegram_destination_id: string | null;
    delivery_url: string | null;
    delivery_message: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    workspace_id: string;
    flow_id: string;
    delivery_type?: Exclude<FlowPlanDeliveryType, "default">;
    telegram_destination_id?: string | null;
    delivery_url?: string | null;
    delivery_message?: string | null;
  };
  Update: Partial<Omit<FlowDefaultDeliveriesTable["Insert"], "workspace_id" | "flow_id">>;
  Relationships: [];
};

export type FlowPlanPriceVariationsTable = {
  Row: {
    id: string;
    workspace_id: string;
    flow_id: string;
    enabled: boolean;
    cent_range_start: number;
    cent_range_end: number;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    workspace_id: string;
    flow_id: string;
    enabled?: boolean;
    cent_range_start?: number;
    cent_range_end?: number;
  };
  Update: Partial<Omit<FlowPlanPriceVariationsTable["Insert"], "workspace_id" | "flow_id">>;
  Relationships: [];
};

export type FlowUpsellSequencesTable = {
  Row: {
    id: string;
    workspace_id: string;
    flow_id: string;
    sequence_key: string;
    order_index: number;
    delay_value: number;
    delay_unit: FlowOfferDelayUnit;
    message: string;
    required: boolean;
    accept_button_text: string;
    accept_button_color: FlowOfferButtonColor;
    decline_button_text: string | null;
    decline_button_color: FlowOfferButtonColor;
    media_type: string | null;
    media_group: boolean;
    delivery_type: FlowOfferDeliveryType;
    delivery_chat_id: number | null;
    delivery_url: string | null;
    delivery_message: string | null;
    order_bump_mode: FlowOfferOrderBumpMode;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    workspace_id: string;
    flow_id: string;
    sequence_key: string;
    order_index?: number;
    delay_value?: number;
    delay_unit?: FlowOfferDelayUnit;
    message?: string;
    required?: boolean;
    accept_button_text?: string;
    accept_button_color?: FlowOfferButtonColor;
    decline_button_text?: string | null;
    decline_button_color?: FlowOfferButtonColor;
    media_type?: string | null;
    media_group?: boolean;
    delivery_type?: FlowOfferDeliveryType;
    delivery_chat_id?: number | null;
    delivery_url?: string | null;
    delivery_message?: string | null;
    order_bump_mode?: FlowOfferOrderBumpMode;
  };
  Update: Partial<Omit<FlowUpsellSequencesTable["Insert"], "workspace_id" | "flow_id">>;
  Relationships: [];
};

export type FlowUpsellSequencePlansTable = {
  Row: {
    id: string;
    workspace_id: string;
    flow_id: string;
    upsell_sequence_id: string;
    flow_plan_id: string;
    order_index: number;
    created_at: string;
  };
  Insert: {
    id?: string;
    workspace_id: string;
    flow_id: string;
    upsell_sequence_id: string;
    flow_plan_id: string;
    order_index?: number;
  };
  Update: Partial<Omit<FlowUpsellSequencePlansTable["Insert"], "workspace_id" | "flow_id">>;
  Relationships: [];
};

export type FlowUpsellSequenceMediaTable = {
  Row: {
    id: string;
    workspace_id: string;
    flow_id: string;
    upsell_sequence_id: string;
    media_kind: string;
    file_name: string;
    file_path: string;
    file_type: string;
    order_index: number;
    grouped: boolean;
    created_at: string;
  };
  Insert: {
    id?: string;
    workspace_id: string;
    flow_id: string;
    upsell_sequence_id: string;
    media_kind: string;
    file_name: string;
    file_path: string;
    file_type: string;
    order_index?: number;
    grouped?: boolean;
  };
  Update: Partial<Omit<FlowUpsellSequenceMediaTable["Insert"], "workspace_id" | "flow_id">>;
  Relationships: [];
};

export type FlowSessionsTable = {
  Row: {
    id: string;
    workspace_id: string;
    deployment_id: string;
    variant_id: string;
    flow_id: string;
    flow_version_id: string;
    telegram_bot_id: string;
    telegram_chat_id: string | null;
    status: FlowSessionStatus;
    current_node_key: string | null;
    context: Json;
    started_at: string;
    last_event_at: string | null;
    ended_at: string | null;
    session_key: string | null;
    telegram_user_external_id: number | null;
    telegram_chat_external_id: number | null;
    lead_id: string | null;
    current_step: string;
    current_offer: string | null;
    selected_plan_id: string | null;
    selected_order_bump_id: string | null;
    selected_upsell_id: string | null;
    selected_downsell_id: string | null;
    payment_id: string | null;
    payment_status: "pending" | "approved" | "rejected" | "cancelled" | "expired" | "refunded" | "failed";
    conversation_status: FlowConversationStatus;
    last_interaction_at: string;
  };
  Insert: {
    workspace_id: string;
    deployment_id: string;
    variant_id: string;
    flow_id: string;
    flow_version_id: string;
    telegram_bot_id: string;
    telegram_chat_id?: string | null;
    status?: FlowSessionStatus;
    current_node_key?: string | null;
    context?: Json;
    last_event_at?: string | null;
    ended_at?: string | null;
    session_key?: string | null;
    telegram_user_external_id?: number | null;
    telegram_chat_external_id?: number | null;
    lead_id?: string | null;
    current_step?: string;
    current_offer?: string | null;
    selected_plan_id?: string | null;
    selected_order_bump_id?: string | null;
    selected_upsell_id?: string | null;
    selected_downsell_id?: string | null;
    payment_id?: string | null;
    payment_status?: FlowSessionsTable["Row"]["payment_status"];
    conversation_status?: FlowConversationStatus;
    last_interaction_at?: string;
  };
  Update: Partial<Omit<FlowSessionsTable["Insert"], "workspace_id" | "deployment_id" | "variant_id" | "flow_id" | "flow_version_id" | "telegram_bot_id">>;
  Relationships: [];
};

export type FlowEventsTable = {
  Row: {
    id: string;
    workspace_id: string;
    session_id: string;
    event_type: string;
    payload: Json;
    created_at: string;
  };
  Insert: {
    workspace_id: string;
    session_id: string;
    event_type: string;
    payload?: Json;
  };
  Update: Record<string, never>;
  Relationships: [];
};

export type FlowCheckoutsTable = {
  Row: {
    id: string;
    workspace_id: string;
    session_id: string;
    flow_id: string;
    flow_version_id: string;
    telegram_bot_id: string;
    lead_id: string | null;
    plan_id: string;
    order_bump_id: string | null;
    upsell_id: string | null;
    downsell_id: string | null;
    subtotal_cents: number;
    order_bump_cents: number;
    total_cents: number;
    currency: "BRL";
    environment: PaymentEnvironment;
    provider: PaymentGatewayProvider;
    payment_id: string | null;
    payment_status: "pending" | "approved" | "rejected" | "cancelled" | "expired" | "refunded" | "failed";
    status: FlowCheckoutStatus;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    workspace_id: string;
    session_id: string;
    flow_id: string;
    flow_version_id: string;
    telegram_bot_id: string;
    lead_id?: string | null;
    plan_id: string;
    order_bump_id?: string | null;
    upsell_id?: string | null;
    downsell_id?: string | null;
    subtotal_cents: number;
    order_bump_cents?: number;
    total_cents: number;
    currency?: "BRL";
    environment?: PaymentEnvironment;
    provider?: PaymentGatewayProvider;
    payment_id?: string | null;
    payment_status?: FlowCheckoutsTable["Row"]["payment_status"];
    status?: FlowCheckoutStatus;
  };
  Update: Partial<Omit<FlowCheckoutsTable["Insert"], "workspace_id" | "session_id" | "flow_id" | "flow_version_id" | "telegram_bot_id" | "plan_id">>;
  Relationships: [];
};
