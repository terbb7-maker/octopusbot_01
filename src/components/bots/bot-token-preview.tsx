import { Bot, CheckCircle2, Loader2 } from "lucide-react";

type BotTokenPreviewProps = {
  loading: boolean;
  bot:
    | {
        id: number;
        name: string;
        username: string;
        avatarBase64: string | null;
      }
    | null;
};

export function BotTokenPreview({ loading, bot }: BotTokenPreviewProps) {
  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-md border border-white/10 bg-black/20 p-4 text-sm text-muted-foreground">
        <Loader2 className="size-5 animate-spin text-primary" aria-hidden="true" />
        Validando token na Telegram Bot API...
      </div>
    );
  }

  if (!bot) {
    return null;
  }

  return (
    <div className="flex items-center gap-4 rounded-md border border-emerald-400/20 bg-emerald-400/10 p-4">
      <div
        className="flex size-12 shrink-0 items-center justify-center rounded-md bg-primary/15 bg-cover bg-center text-primary"
        style={bot.avatarBase64 ? { backgroundImage: `url(${bot.avatarBase64})` } : undefined}
      >
        {!bot.avatarBase64 ? <Bot className="size-6" aria-hidden="true" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-foreground">
            {bot.name}
          </p>
          <CheckCircle2 className="size-4 text-emerald-300" aria-hidden="true" />
        </div>
        <p className="truncate text-xs text-muted-foreground">
          @{bot.username} · ID {bot.id}
        </p>
      </div>
    </div>
  );
}
