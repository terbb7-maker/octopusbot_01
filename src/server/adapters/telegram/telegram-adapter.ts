import type {
  TelegramApiResponse,
  TelegramBotProfile,
  TelegramChatMemberStatus,
  TelegramInlineKeyboardMarkup,
} from "@/server/adapters/telegram/types";
import {
  TelegramInvalidTokenError,
  TelegramNetworkError,
} from "@/server/adapters/telegram/types";
import {
  telegramFileRequest,
  telegramJsonRequest,
} from "@/server/adapters/telegram/telegram-http";

const TELEGRAM_API_URL = "https://api.telegram.org";
const TELEGRAM_FILE_URL = "https://api.telegram.org/file";
const TOKEN_PATTERN = /^\d{6,14}:[A-Za-z0-9_-]{30,}$/;

type TelegramUser = {
  id: number;
  is_bot: boolean;
  first_name: string;
  username?: string;
};

type TelegramPhotoSize = {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
};

type TelegramFile = {
  file_id: string;
  file_unique_id: string;
  file_path?: string;
  file_size?: number;
};

type TelegramChatMember = {
  status: TelegramChatMemberStatus;
};

function apiUrl(token: string, method: string) {
  return `${TELEGRAM_API_URL}/bot${token}/${method}`;
}

async function requestTelegram<T>(token: string, method: string, init?: RequestInit) {
  const payload = await telegramJsonRequest<TelegramApiResponse<T>>(
    apiUrl(token, method),
    init,
  ).catch(() => null);

  if (!payload) {
    throw new TelegramNetworkError();
  }

  if (!payload.ok) {
    throw new TelegramInvalidTokenError(
      payload.description ?? "Token do Telegram invalido.",
    );
  }

  return payload.result;
}

function pickLargestPhoto(photos: TelegramPhotoSize[][]) {
  return photos
    .flat()
    .sort((a, b) => (b.file_size ?? b.width * b.height) - (a.file_size ?? a.width * a.height))[0];
}

async function fetchBotAvatar(token: string, botId: number) {
  const result = await requestTelegram<{
    photos: TelegramPhotoSize[][];
    total_count: number;
  }>(token, `getUserProfilePhotos?user_id=${botId}&limit=1`);
  const photo = pickLargestPhoto(result.photos);

  if (!photo) {
    return null;
  }

  const file = await requestTelegram<TelegramFile>(
    token,
    `getFile?file_id=${encodeURIComponent(photo.file_id)}`,
  );

  if (!file.file_path) {
    return null;
  }

  const image = await telegramFileRequest(
    `${TELEGRAM_FILE_URL}/bot${token}/${file.file_path}`,
  );

  if (!image) return null;

  return {
    avatarBase64: `data:${image.contentType};base64,${Buffer.from(image.bytes).toString(
      "base64",
    )}`,
    avatarBytes: image.bytes,
    avatarContentType: image.contentType,
  };
}

export function isTelegramBotTokenFormat(token: string) {
  return TOKEN_PATTERN.test(token.trim());
}

export async function getTelegramBotProfile(
  token: string,
): Promise<TelegramBotProfile> {
  const trimmedToken = token.trim();

  if (!isTelegramBotTokenFormat(trimmedToken)) {
    throw new Error("Formato de token invalido.");
  }

  const bot = await requestTelegram<TelegramUser>(trimmedToken, "getMe");

  if (!bot.is_bot || !bot.username) {
    throw new Error("O token informado nao pertence a um bot valido.");
  }

  const avatar = await fetchBotAvatar(trimmedToken, bot.id).catch(() => null);

  return {
    id: bot.id,
    name: bot.first_name,
    username: bot.username,
    ...avatar,
  };
}

export async function setTelegramWebhook({
  botId,
  token,
  appUrl,
  secretToken,
}: {
  botId: string;
  token: string;
  appUrl: string;
  secretToken: string;
}) {
  const url = new URL(`/api/webhooks/telegram/${botId}`, appUrl);
  const body = new URLSearchParams({
    url: url.toString(),
    secret_token: secretToken,
    allowed_updates: JSON.stringify(["message", "callback_query"]),
    drop_pending_updates: "false",
  });

  await requestTelegram(token, "setWebhook", {
    body,
    method: "POST",
  });
}

export async function getTelegramChatMemberStatus({
  chatId,
  token,
  userId,
}: {
  chatId: number;
  token: string;
  userId: number;
}) {
  const body = new URLSearchParams({
    chat_id: String(chatId),
    user_id: String(userId),
  });
  const member = await requestTelegram<TelegramChatMember>(token, "getChatMember", {
    body,
    method: "POST",
  });

  return member.status;
}

export async function sendTelegramMessage({
  chatId,
  replyMarkup,
  text,
  token,
}: {
  chatId: number;
  replyMarkup?: TelegramInlineKeyboardMarkup;
  text: string;
  token: string;
}) {
  const body = new URLSearchParams({
    chat_id: String(chatId),
    disable_web_page_preview: "true",
    parse_mode: "HTML",
    text,
  });

  if (replyMarkup) {
    body.set("reply_markup", JSON.stringify(replyMarkup));
  }

  await requestTelegram(token, "sendMessage", {
    body,
    method: "POST",
  });
}

export async function answerTelegramCallbackQuery({
  callbackQueryId,
  text,
  token,
}: {
  callbackQueryId: string;
  text?: string;
  token: string;
}) {
  const body = new URLSearchParams({
    callback_query_id: callbackQueryId,
  });

  if (text) body.set("text", text);

  await requestTelegram(token, "answerCallbackQuery", {
    body,
    method: "POST",
  });
}

export async function sendTelegramMedia({
  caption,
  chatId,
  mediaUrl,
  token,
  type,
}: {
  caption?: string;
  chatId: number;
  mediaUrl: string;
  token: string;
  type: "audio" | "image" | "video";
}) {
  const method = type === "image" ? "sendPhoto" : type === "video" ? "sendVideo" : "sendAudio";
  const mediaField = type === "image" ? "photo" : type;
  const body = new URLSearchParams({
    chat_id: String(chatId),
    [mediaField]: mediaUrl,
    parse_mode: "HTML",
  });

  if (caption) body.set("caption", caption);

  await requestTelegram(token, method, {
    body,
    method: "POST",
  });
}

export async function sendTelegramMediaGroup({
  chatId,
  mediaUrls,
  token,
}: {
  chatId: number;
  mediaUrls: string[];
  token: string;
}) {
  if (!mediaUrls.length) return;

  const body = new URLSearchParams({
    chat_id: String(chatId),
    media: JSON.stringify(
      mediaUrls.slice(0, 10).map((media) => ({
        media,
        type: "photo",
      })),
    ),
  });

  await requestTelegram(token, "sendMediaGroup", {
    body,
    method: "POST",
  });
}
