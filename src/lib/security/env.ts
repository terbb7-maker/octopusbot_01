type PublicEnv = {
  appUrl: string;
  supabaseUrl: string;
  supabasePublishableKey: string;
};

type SupabasePublicEnv = Pick<
  PublicEnv,
  "supabasePublishableKey" | "supabaseUrl"
>;

type SupabaseAdminEnv = PublicEnv & {
  supabaseServiceRoleKey: string;
};

type TelegramWebhookEnv = {
  telegramWebhookSecret: string;
};

type TelegramBotTokenEnv = {
  telegramBotTokenEncryptionKey: string;
};

type PaymentProviderEnv = {
  paymentProvider: string;
  paymentProviderWebhookSecret: string;
  paymentProviderApiKey: string;
};

type ServerEnv = SupabaseAdminEnv &
  TelegramWebhookEnv &
  TelegramBotTokenEnv &
  PaymentProviderEnv;

function readEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getPublicEnv(): PublicEnv {
  return {
    appUrl: readEnv("NEXT_PUBLIC_APP_URL"),
    ...getSupabasePublicEnv(),
  };
}

export function getSupabasePublicEnv(): SupabasePublicEnv {
  return {
    supabaseUrl: readEnv("NEXT_PUBLIC_SUPABASE_URL"),
    supabasePublishableKey: readEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  };
}

export function getSupabaseAdminEnv(): SupabaseAdminEnv {
  return {
    ...getPublicEnv(),
    supabaseServiceRoleKey: readEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
}

export function getTelegramWebhookEnv(): TelegramWebhookEnv {
  return {
    telegramWebhookSecret: readEnv("TELEGRAM_WEBHOOK_SECRET"),
  };
}

export function getTelegramBotTokenEnv(): TelegramBotTokenEnv {
  return {
    telegramBotTokenEncryptionKey: readEnv(
      "TELEGRAM_BOT_TOKEN_ENCRYPTION_KEY",
    ),
  };
}

export function getPaymentProviderEnv(): PaymentProviderEnv {
  return {
    paymentProvider: readEnv("PAYMENT_PROVIDER"),
    paymentProviderWebhookSecret: readEnv("PAYMENT_PROVIDER_WEBHOOK_SECRET"),
    paymentProviderApiKey: readEnv("PAYMENT_PROVIDER_API_KEY"),
  };
}

export function getServerEnv(): ServerEnv {
  return {
    ...getSupabaseAdminEnv(),
    ...getTelegramWebhookEnv(),
    ...getTelegramBotTokenEnv(),
    ...getPaymentProviderEnv(),
  };
}
