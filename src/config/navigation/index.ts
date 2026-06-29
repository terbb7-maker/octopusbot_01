import {
  Bot,
  CreditCard,
  GitBranch,
  LayoutDashboard,
  Settings,
  UsersRound,
} from "lucide-react";

export const dashboardNavigation = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Bots",
    href: "/bots",
    icon: Bot,
  },
  {
    title: "Fluxos",
    href: "/flows",
    icon: GitBranch,
  },
  {
    title: "Pagamentos",
    href: "/payments",
    icon: CreditCard,
  },
  {
    title: "Clientes",
    href: "/customers",
    icon: UsersRound,
  },
  {
    title: "Configuracoes",
    href: "/settings",
    icon: Settings,
  },
] as const;
