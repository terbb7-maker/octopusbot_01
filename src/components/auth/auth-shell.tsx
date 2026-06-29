import { type ReactNode } from "react";
import { Bot, CreditCard, GitBranch, Sparkles } from "lucide-react";

import { appConfig } from "@/config/app";
import { Badge } from "@/components/ui/badge";

type AuthShellProps = {
  children: ReactNode;
};

const authHighlights = [
  {
    title: "Telegram",
    description: "Venda direto pela conversa",
    icon: Bot,
  },
  {
    title: "PIX",
    description: "Cobranca e confirmacao",
    icon: CreditCard,
  },
  {
    title: "Fluxos",
    description: "Jornadas preparadas para evoluir",
    icon: GitBranch,
  },
];

export function AuthShell({ children }: AuthShellProps) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] opacity-20" />
      <div className="relative grid w-full max-w-5xl gap-6 lg:grid-cols-[1fr_420px]">
        <section className="hidden rounded-md border border-white/10 bg-white/[0.035] p-6 shadow-2xl shadow-black/20 lg:flex lg:flex-col lg:justify-between">
          <div>
            <div className="mb-8 flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground shadow-[0_0_28px_rgba(168,85,247,0.34)]">
                O
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {appConfig.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Automacao de vendas para Telegram
                </p>
              </div>
            </div>
            <Badge className="mb-4 border-primary/30 bg-primary/15 text-primary">
              SaaS MVP
            </Badge>
            <h1 className="max-w-md text-3xl font-semibold tracking-normal text-foreground">
              Automatize vendas no Telegram com PIX e operacao organizada.
            </h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground">
              Uma base premium para operar bots, fluxos, pagamentos e clientes
              em um workspace seguro.
            </p>
          </div>

          <div className="mt-10 grid gap-3">
            {authHighlights.map((item) => {
              const Icon = item.icon;

              return (
                <div
                  key={item.title}
                  className="flex items-center gap-3 rounded-md border border-white/10 bg-black/20 p-3"
                >
                  <div className="flex size-9 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <section className="flex flex-col justify-center">
          <div className="mb-4 flex items-center justify-center gap-2 lg:hidden">
            <div className="flex size-9 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
              O
            </div>
            <span className="text-sm font-semibold">{appConfig.name}</span>
          </div>
          <div className="mb-3 flex justify-center lg:hidden">
            <Badge className="border-primary/30 bg-primary/15 text-primary">
              <Sparkles className="size-3.5" aria-hidden="true" />
              MVP premium
            </Badge>
          </div>
          {children}
        </section>
      </div>
    </main>
  );
}
