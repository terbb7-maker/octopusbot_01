import {
  BadgePercent,
  MessageSquareText,
  PanelsTopLeft,
  Send,
  SlidersHorizontal,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

import { DeliveriesSection } from "@/components/flows/editor/deliveries-section";
import { DownsellsSection } from "@/components/flows/editor/downsells-section";
import { InitialConfigSection } from "@/components/flows/editor/initial-config-section";
import { MessagesSection } from "@/components/flows/editor/messages-section";
import { OrderBumpsSection } from "@/components/flows/editor/order-bumps-section";
import { PlansSection } from "@/components/flows/editor/plans-section";
import { UpsellsSection } from "@/components/flows/editor/upsells-section";
import type { BasicFlowEditorData } from "@/server/services/flows";

export type BasicEditorSectionId =
  | "initial-config"
  | "plans"
  | "order-bumps"
  | "upsells"
  | "downsells"
  | "deliveries"
  | "messages";

export type BasicEditorSectionProps = {
  flow: BasicFlowEditorData;
};

export type BasicEditorSection = {
  id: BasicEditorSectionId;
  title: string;
  description: string;
  icon: typeof SlidersHorizontal;
  component: (props: BasicEditorSectionProps) => React.ReactNode;
};

export const basicEditorSections: BasicEditorSection[] = [
  {
    id: "initial-config",
    title: "Configuracao Inicial",
    description: "Primeira experiencia enviada ao usuario.",
    icon: SlidersHorizontal,
    component: InitialConfigSection,
  },
  {
    id: "plans",
    title: "Planos",
    description: "Ofertas exibidas no Telegram.",
    icon: PanelsTopLeft,
    component: PlansSection,
  },
  {
    id: "order-bumps",
    title: "Order Bump",
    description: "Ofertas complementares antes do pagamento.",
    icon: BadgePercent,
    component: OrderBumpsSection,
  },
  {
    id: "upsells",
    title: "Upsell",
    description: "Sequencias de ofertas adicionais.",
    icon: TrendingUp,
    component: UpsellsSection,
  },
  {
    id: "downsells",
    title: "Downsell",
    description: "Sequencias de ofertas alternativas.",
    icon: TrendingDown,
    component: DownsellsSection,
  },
  {
    id: "deliveries",
    title: "Entregas",
    description: "Conteudos liberados automaticamente apos a venda.",
    icon: Send,
    component: DeliveriesSection,
  },
  {
    id: "messages",
    title: "Mensagens",
    description: "Conteudos enviados durante a conversa do bot.",
    icon: MessageSquareText,
    component: MessagesSection,
  },
];
