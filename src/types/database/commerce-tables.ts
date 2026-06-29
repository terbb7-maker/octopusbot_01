import type { Json } from "@/types/database/json";

export type PaymentEnvironment = "production" | "sandbox";
export type PaymentGatewayProvider =
  | "sandbox"
  | "pushinpay"
  | "bspay"
  | "gothampay"
  | "ativopay"
  | "woovi";
export type SandboxPaymentResult = "always_approve" | "always_pending";

export type PaymentsTable = {
  Row: {
    id: string;
    workspace_id: string;
    provider: string;
    provider_payment_id: string | null;
    method: "pix";
    status:
      | "pending"
      | "approved"
      | "rejected"
      | "cancelled"
      | "expired"
      | "refunded"
      | "failed";
    amount_cents: number;
    currency: "BRL";
    flow_id: string | null;
    flow_plan_id: string | null;
    checkout_id: string | null;
    session_id: string | null;
    revenue_kind: "plan" | "order_bump" | "upsell" | "downsell" | "bundle";
    environment: PaymentEnvironment;
    approved_at: string | null;
    expires_at: string | null;
    metadata: Json;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    workspace_id: string;
    provider: string;
    provider_payment_id?: string | null;
    method?: "pix";
    status?: PaymentsTable["Row"]["status"];
    amount_cents: number;
    currency?: "BRL";
    flow_id?: string | null;
    flow_plan_id?: string | null;
    checkout_id?: string | null;
    session_id?: string | null;
    revenue_kind?: PaymentsTable["Row"]["revenue_kind"];
    environment?: PaymentEnvironment;
    approved_at?: string | null;
    expires_at?: string | null;
    metadata?: Json;
  };
  Update: Partial<Omit<PaymentsTable["Insert"], "workspace_id">>;
  Relationships: [];
};

export type PixChargesTable = {
  Row: {
    id: string;
    workspace_id: string;
    payment_id: string;
    provider: string;
    provider_charge_id: string | null;
    qr_code: string;
    qr_code_base64: string | null;
    copy_paste: string;
    status: "pending" | "paid" | "expired" | "cancelled" | "failed";
    environment: PaymentEnvironment;
    expires_at: string;
    paid_at: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    workspace_id: string;
    payment_id: string;
    provider: string;
    provider_charge_id?: string | null;
    qr_code: string;
    qr_code_base64?: string | null;
    copy_paste: string;
    status?: PixChargesTable["Row"]["status"];
    environment?: PaymentEnvironment;
    expires_at: string;
    paid_at?: string | null;
  };
  Update: Partial<Omit<PixChargesTable["Insert"], "workspace_id" | "payment_id">>;
  Relationships: [];
};

export type PaymentEventsTable = {
  Row: {
    id: string;
    workspace_id: string | null;
    payment_id: string | null;
    provider: string;
    provider_event_id: string;
    event_type: string;
    payload: Json;
    processing_status:
      | "received"
      | "processing"
      | "processed"
      | "ignored"
      | "failed";
    processed_at: string | null;
    error_message: string | null;
    created_at: string;
    environment: PaymentEnvironment;
  };
  Insert: {
    workspace_id?: string | null;
    payment_id?: string | null;
    provider: string;
    provider_event_id: string;
    event_type: string;
    payload: Json;
    processing_status?: PaymentEventsTable["Row"]["processing_status"];
    processed_at?: string | null;
    error_message?: string | null;
    environment?: PaymentEnvironment;
  };
  Update: Partial<Omit<PaymentEventsTable["Insert"], "provider_event_id">>;
  Relationships: [];
};

export type WorkspacePaymentSettingsTable = {
  Row: {
    workspace_id: string;
    provider: PaymentGatewayProvider;
    sandbox_result: SandboxPaymentResult;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    workspace_id: string;
    provider?: PaymentGatewayProvider;
    sandbox_result?: SandboxPaymentResult;
  };
  Update: Partial<Omit<WorkspacePaymentSettingsTable["Insert"], "workspace_id">>;
  Relationships: [];
};
