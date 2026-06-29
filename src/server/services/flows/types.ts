import type { FlowKind, FlowStatus } from "@/types/domain";

export type FlowListItem = {
  id: string;
  name: string;
  kind: FlowKind;
  linkedBots: number;
  status: FlowStatus;
  lastEditedAt: string;
};

export type FlowBotOption = {
  id: string;
  name: string;
  username: string;
  status: "active" | "disabled" | "revoked";
  connectedFlowId: string | null;
  connectedFlowName: string | null;
};

export type FlowsOverview = {
  flows: FlowListItem[];
  botOptions: FlowBotOption[];
  linkedFlows: number;
  basicFlows: number;
  advancedFlows: number;
};

export type FlowActionResult = {
  ok: boolean;
  message: string;
  flowId?: string;
};

export type CreateFlowInput = {
  name: string;
  mode: "basic";
};

export type BasicFlowEditorData = {
  id: string;
  name: string;
  status: FlowStatus;
  updatedAt: string;
  draftVersionId: string | null;
  initialConfig: FlowInitialConfig;
  planMessage: string;
  plans: FlowPlan[];
  planDefaultDelivery: FlowPlanDefaultDelivery;
  planPriceVariation: FlowPlanPriceVariation;
  deliveries: FlowDelivery[];
  messages: FlowMessagesConfig;
  orderBumps: FlowOrderBumps;
  upsells: FlowUpsellSequence[];
  downsells: FlowDownsellSequence[];
  telegramDeliveryDestinations: TelegramDeliveryDestination[];
  previewBot: FlowPreviewBot | null;
};

export type FlowPreviewBot = {
  name: string;
  username: string;
};

export type FlowInitialConfigMediaKind = "image" | "video" | "audio";

export type FlowInitialConfigMediaValue = {
  id?: string;
  name: string;
  path: string;
  type: string;
  url?: string;
  order?: number;
  signedUrl?: string | null;
};

export type FlowInitialConfigMedia = {
  type?: FlowInitialConfigMediaKind;
  groupImages?: boolean;
  images?: FlowInitialConfigMediaValue[];
  video?: FlowInitialConfigMediaValue | null;
  audio?: FlowInitialConfigMediaValue | null;
  image?: FlowInitialConfigMediaValue;
};

export type FlowInitialCtaAction = "show_plans" | "open_link" | "send_message";

export type FlowInitialCta = {
  enabled: boolean;
  label: string;
  action: FlowInitialCtaAction;
  url?: string;
  message?: string;
  value?: string;
};

export type FlowInitialConfig = {
  media?: FlowInitialConfigMedia;
  message?: string;
  html?: string;
  variables?: string[];
  cta?: FlowInitialCta;
};

export type FlowPlanImage = {
  name: string;
  path: string;
  type: string;
  signedUrl?: string | null;
};

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

export type FlowPlanStats = {
  leads: number;
  pixGenerated: number;
  pixPaid: number;
  conversionRate: number;
  revenueCents: number;
};

export type FlowPlanDeliveryConfig = {
  telegramDestinationId?: string;
  linkUrl?: string;
  message?: string;
};

export type FlowPlanDefaultDelivery = {
  type: Exclude<FlowPlanDeliveryType, "default">;
  telegramDestinationId?: string;
  linkUrl?: string;
  message?: string;
};

export type FlowPlanPriceVariation = {
  enabled: boolean;
  centRangeStart: number;
  centRangeEnd: number;
};

export type FlowPlanOrderBump = {
  enabled: boolean;
  name?: string;
  description?: string;
  priceCents?: number;
};

export type FlowPlan = {
  id: string;
  name: string;
  description?: string;
  order: number;
  priceCents: number;
  billingType: FlowPlanBillingType;
  image?: FlowPlanImage | null;
  buttonLabel: string;
  buttonValue?: string;
  color: string;
  buttonColor: FlowPlanButtonColor;
  deliveryType: FlowPlanDeliveryType;
  deliveryConfig: FlowPlanDeliveryConfig;
  useDefaultDelivery: boolean;
  useGlobalOrderBump: boolean;
  orderBumpId?: string | null;
  active: boolean;
  stats: FlowPlanStats;
  orderBump: FlowPlanOrderBump;
};

export type FlowDeliveryType =
  | "telegram_group"
  | "telegram_channel"
  | "link"
  | "file"
  | "custom_message";

export type FlowDeliveryFile = {
  name: string;
  path: string;
  type: string;
  signedUrl?: string | null;
};

export type TelegramDeliveryDestination = {
  id: string;
  botId: string;
  botName: string;
  chatExternalId: number;
  chatType: "group" | "supergroup" | "channel";
  title: string;
  username?: string | null;
};

export type FlowDelivery = {
  id: string;
  type: FlowDeliveryType;
  name: string;
  telegramDestinationId?: string;
  linkUrl?: string;
  file?: FlowDeliveryFile | null;
  message?: string;
};

export type FlowOrderBumpImage = {
  name: string;
  path: string;
  type: string;
  signedUrl?: string | null;
};

export type FlowOrderBumpButton = {
  id: string;
  label: string;
  value: string;
};

export type FlowOrderBumpOffer = {
  enabled: boolean;
  title: string;
  priceCents: number;
  message: string;
  image?: FlowOrderBumpImage | null;
  buttons: FlowOrderBumpButton[];
  deliveryId?: string;
};

export type FlowOrderBumpIndividual = FlowOrderBumpOffer & {
  id: string;
  planId: string;
};

export type FlowOrderBumps = {
  global: FlowOrderBumpOffer;
  individual: FlowOrderBumpIndividual[];
};

export type FlowUpsellImage = {
  name: string;
  path: string;
  type: string;
  signedUrl?: string | null;
};

export type FlowUpsellButton = {
  label: string;
  value: string;
};

export type FlowUpsellSequence = {
  id: string;
  delayMinutes: number;
  message: string;
  image?: FlowUpsellImage | null;
  button: FlowUpsellButton;
  planId?: string;
  deliveryId?: string;
};

export type FlowDownsellImage = FlowUpsellImage;

export type FlowDownsellButton = FlowUpsellButton;

export type FlowDownsellSequence = FlowUpsellSequence;

export type FlowMessageKind =
  | "pix_generated"
  | "payment_approved"
  | "pix_expired"
  | "error"
  | "cancellation"
  | "social_proof";

export type FlowMessageMedia = {
  id: string;
  name: string;
  path: string;
  type: string;
  signedUrl?: string | null;
};

export type FlowMessageButton = {
  id: string;
  label: string;
  value: string;
};

export type FlowMessageTemplate = {
  kind: FlowMessageKind;
  text: string;
  media: FlowMessageMedia[];
  buttons: FlowMessageButton[];
  variables: string[];
};

export type FlowMessagesConfig = Record<FlowMessageKind, FlowMessageTemplate>;
