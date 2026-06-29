type LogPayload = Record<string, unknown>;

function serialize(payload: LogPayload) {
  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
}

export function runtimeLog(message: string, payload: LogPayload = {}) {
  console.log(`[telegram-runtime] ${message}`, serialize(payload));
}

export function runtimeError(message: string, error: unknown, payload: LogPayload = {}) {
  const details = error instanceof Error
    ? { error: error.message, stack: error.stack }
    : { error: String(error) };

  console.error(`[telegram-runtime] ${message}`, serialize({ ...payload, ...details }));
}
