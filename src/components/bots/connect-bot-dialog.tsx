"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert } from "lucide-react";

import { BotTokenPreview } from "@/components/bots/bot-token-preview";
import { BotTutorialAccordion } from "@/components/bots/bot-tutorial-accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBotAction, updateBotAction } from "@/server/actions/bots";
import type { BotListItem } from "@/server/services/bots";

type ValidatedBot = {
  id: number;
  name: string;
  username: string;
  avatarBase64: string | null;
};

type ConnectBotDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bot?: BotListItem | null;
};

const tokenPattern = /^\d{6,14}:[A-Za-z0-9_-]{30,}$/;

export function ConnectBotDialog({
  open,
  onOpenChange,
  bot,
}: ConnectBotDialogProps) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [validatedBot, setValidatedBot] = useState<ValidatedBot | null>(null);
  const [error, setError] = useState("");
  const [errorTitle, setErrorTitle] = useState("Token invalido");
  const [loading, setLoading] = useState(false);
  const [resultMessage, setResultMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const isEditing = Boolean(bot);
  const tokenIsValid = useMemo(() => tokenPattern.test(token.trim()), [token]);

  useEffect(() => {
    if (!open) {
      setToken("");
      setValidatedBot(null);
      setError("");
      setResultMessage("");
    }
  }, [open]);

  useEffect(() => {
    if (!token.trim()) {
      setValidatedBot(null);
      setError("");
      setErrorTitle("Token invalido");
      setLoading(false);
      return;
    }

    if (!tokenIsValid) {
      setValidatedBot(null);
      setError("Formato de token invalido.");
      setErrorTitle("Token invalido");
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch("/api/telegram/bots/validate", {
          body: JSON.stringify({ token: token.trim() }),
          headers: { "Content-Type": "application/json" },
          method: "POST",
          signal: controller.signal,
        });
        const payload = (await response.json()) as {
          ok: boolean;
          code?: string;
          message?: string;
          bot?: ValidatedBot;
        };

        if (!response.ok || !payload.ok || !payload.bot) {
          setErrorTitle(
            payload.code === "telegram_unreachable"
              ? "Telegram indisponivel"
              : "Token invalido",
          );
          throw new Error(payload.message ?? "Token invalido.");
        }

        setValidatedBot(payload.bot);
      } catch (fetchError) {
        if (!controller.signal.aborted) {
          setValidatedBot(null);
          setError(
            fetchError instanceof Error
              ? fetchError.message
              : "Nao foi possivel validar o token.",
          );
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 650);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [token, tokenIsValid]);

  function submit() {
    if (!validatedBot || loading || pending) return;

    startTransition(async () => {
      const actionResult =
        isEditing && bot
          ? await updateBotAction(bot.id, token)
          : await createBotAction(token);

      if (!actionResult.ok) {
        setResultMessage(actionResult.message);
        return;
      }

      router.refresh();
      onOpenChange(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar Bot" : "Conectar Bot"}</DialogTitle>
          <DialogDescription>
            Valide o token do Telegram e salve a conexao no workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="bot-token">Token do Bot *</Label>
            <Input
              id="bot-token"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
              autoComplete="off"
            />
            <p className="text-xs text-muted-foreground">
              Token fornecido pelo @BotFather
            </p>
          </div>

          <BotTokenPreview loading={loading} bot={validatedBot} />

          {error ? (
          <Alert variant="destructive">
              <AlertTitle>{errorTitle}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="bot-name">Nome do Bot</Label>
              <Input id="bot-name" value={validatedBot?.name ?? ""} readOnly />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bot-username">Username do Bot</Label>
              <Input
                id="bot-username"
                value={validatedBot ? `@${validatedBot.username}` : ""}
                readOnly
              />
            </div>
          </div>

          <Alert variant="warning">
            <ShieldAlert className="mb-2 size-5" aria-hidden="true" />
            <AlertTitle>Mantenha seu token seguro.</AlertTitle>
            <AlertDescription>
              Nunca compartilhe o token do seu bot com terceiros.
            </AlertDescription>
          </Alert>

          <BotTutorialAccordion />

          {resultMessage ? (
            <p className="text-sm text-destructive">{resultMessage}</p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={!validatedBot || loading || pending} onClick={submit}>
            {pending ? "Salvando..." : isEditing ? "Salvar Bot" : "Criar Bot"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
