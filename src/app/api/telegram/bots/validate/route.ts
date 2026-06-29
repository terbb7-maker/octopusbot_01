import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  TelegramInvalidTokenError,
  TelegramNetworkError,
} from "@/server/adapters/telegram/types";
import { validateTelegramBotToken } from "@/server/services/bots";

const requestSchema = z.object({
  token: z
    .string()
    .trim()
    .regex(/^\d{6,14}:[A-Za-z0-9_-]{30,}$/),
});

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: "Nao autenticado." }, { status: 401 });
  }

  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: "Informe um token valido." },
      { status: 422 },
    );
  }

  try {
    const profile = await validateTelegramBotToken(parsed.data.token);

    return NextResponse.json({
      ok: true,
      bot: {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        avatarBase64: profile.avatarBase64 ?? null,
      },
    });
  } catch (error) {
    const isNetworkError = error instanceof TelegramNetworkError;
    const isInvalidToken = error instanceof TelegramInvalidTokenError;

    return NextResponse.json(
      {
        ok: false,
        code: isNetworkError
          ? "telegram_unreachable"
          : isInvalidToken
            ? "invalid_token"
            : "unknown",
        message:
          error instanceof Error
            ? error.message
            : "Nao foi possivel validar o token.",
      },
      { status: isNetworkError ? 502 : 400 },
    );
  }
}
