"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, Plus, X } from "lucide-react";

import { appConfig } from "@/config/app";
import { Button } from "@/components/ui/button";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-white/10 bg-background/85 backdrop-blur-xl md:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground shadow-[0_0_28px_rgba(168,85,247,0.34)]">
            O
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              {appConfig.name}
            </p>
            <p className="text-xs text-muted-foreground">Workspace principal</p>
          </div>
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="Abrir menu"
          onClick={() => setOpen(true)}
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl">
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-3"
              onClick={() => setOpen(false)}
            >
              <div className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
                O
              </div>
              <span className="text-sm font-semibold">{appConfig.name}</span>
            </Link>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Fechar menu"
              onClick={() => setOpen(false)}
            >
              <X className="size-5" aria-hidden="true" />
            </Button>
          </div>
          <div className="space-y-5 p-4">
            <Button asChild className="w-full justify-start">
              <Link href="/bots" onClick={() => setOpen(false)}>
                <Plus className="size-4" aria-hidden="true" />
                Conectar bot
              </Link>
            </Button>
            <div>
              <p className="px-3 pb-2 text-[11px] font-medium uppercase tracking-normal text-muted-foreground">
                Operacao
              </p>
              <SidebarNav onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
