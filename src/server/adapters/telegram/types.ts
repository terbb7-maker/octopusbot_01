export type TelegramBotProfile = {
  id: number;
  name: string;
  username: string;
  avatarBase64?: string;
  avatarContentType?: string;
  avatarBytes?: Uint8Array;
};

export type TelegramChatMemberStatus =
  | "creator"
  | "administrator"
  | "member"
  | "restricted"
  | "left"
  | "kicked";

export type TelegramApiError = {
  ok: false;
  description?: string;
  error_code?: number;
};

export type TelegramApiSuccess<T> = {
  ok: true;
  result: T;
};

export type TelegramApiResponse<T> =
  | TelegramApiSuccess<T>
  | TelegramApiError;

export type TelegramInlineKeyboardButton = {
  text: string;
  callback_data?: string;
  url?: string;
};

export type TelegramInlineKeyboardMarkup = {
  inline_keyboard: TelegramInlineKeyboardButton[][];
};

export class TelegramNetworkError extends Error {
  constructor() {
    super("Nao foi possivel conectar a API do Telegram. Verifique a conexao do servidor e tente novamente.");
    this.name = "TelegramNetworkError";
  }
}

export class TelegramInvalidTokenError extends Error {
  constructor(message = "Token do Telegram invalido.") {
    super(message);
    this.name = "TelegramInvalidTokenError";
  }
}
