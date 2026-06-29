import Link from "next/link";
import {
  ChevronDown,
  CircleDollarSign,
  Command,
  LogOut,
  Plus,
  Sparkles,
} from "lucide-react";

import { appConfig } from "@/config/app";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { signOutAction } from "@/features/auth/actions";

export function AppSidebar() {
  return (
    <aside className="hidden min-h-screen w-72 shrink-0 border-r border-white/10 bg-background/80 backdrop-blur-xl md:flex md:flex-col">
      <div className="px-4 py-4">
        <Link
          href="/dashboard"
          className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.035] p-2.5 transition-colors hover:bg-white/[0.06]"
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground shadow-[0_0_28px_rgba(168,85,247,0.34)]">
              O
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-foreground">
                {appConfig.name}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Workspace principal
              </p>
            </div>
          </div>
          <ChevronDown
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
        </Link>
      </div>

      <div className="px-4 pb-3">
        <Button asChild className="h-9 w-full justify-start">
          <Link href="/bots">
            <Plus className="size-4" aria-hidden="true" />
            Conectar bot
          </Link>
        </Button>
      </div>

      <Separator className="bg-white/10" />

      <nav className="flex flex-1 flex-col gap-1 px-3 py-4">
        <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-normal text-muted-foreground">
          Operacao
        </p>
        <SidebarNav />
      </nav>

      <div className="px-3 pb-3">
        <div className="rounded-md border border-white/10 bg-white/[0.035] p-3">
          <div className="flex items-center justify-between">
            <Badge className="border-primary/25 bg-primary/15 text-primary">
              MVP
            </Badge>
            <Sparkles className="size-4 text-primary" aria-hidden="true" />
          </div>
          <p className="mt-3 text-sm font-medium text-foreground">
            Fluxo pronto para vender
          </p>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            Conecte Telegram, fluxos e PIX para operar vendas assistidas.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-md bg-black/20 p-2">
              <Command className="mb-1 size-3.5 text-primary" />
              Builder
            </div>
            <div className="rounded-md bg-black/20 p-2">
              <CircleDollarSign className="mb-1 size-3.5 text-emerald-300" />
              PIX
            </div>
          </div>
        </div>
      </div>

      <Separator className="bg-white/10" />
      <form action={signOutAction} className="p-3">
        <Button
          type="submit"
          variant="ghost"
          className="w-full justify-start text-muted-foreground hover:text-foreground"
        >
          <LogOut className="size-4" aria-hidden="true" />
          Sair
        </Button>
      </form>
    </aside>
  );
}
