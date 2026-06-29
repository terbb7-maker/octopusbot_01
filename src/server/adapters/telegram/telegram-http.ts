import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const REQUEST_TIMEOUT_MS = 10_000;

function bodyToString(body: BodyInit | null | undefined) {
  if (!body) return undefined;
  if (typeof body === "string") return body;
  if (body instanceof URLSearchParams) return body.toString();

  return undefined;
}

function contentTypeForBody(body: BodyInit | null | undefined) {
  if (body instanceof URLSearchParams) {
    return "application/x-www-form-urlencoded";
  }

  return undefined;
}

async function curlText(url: string, init: RequestInit = {}) {
  const method = init.method ?? (init.body ? "POST" : "GET");
  const body = bodyToString(init.body);
  const args = ["-sS", "--max-time", "15", "-X", method];
  const contentType = contentTypeForBody(init.body);

  if (contentType) {
    args.push("-H", `Content-Type: ${contentType}`);
  }

  if (body) {
    args.push("--data-binary", body);
  }

  args.push(url);

  const { stdout } = await execFileAsync("curl", args, {
    encoding: "utf8",
    maxBuffer: 1024 * 1024 * 4,
  });

  return stdout;
}

async function curlBuffer(url: string) {
  const { stdout } = await execFileAsync(
    "curl",
    ["-sS", "--max-time", "15", url],
    {
      encoding: "buffer",
      maxBuffer: 1024 * 1024 * 4,
    },
  );

  return new Uint8Array(stdout);
}

export async function telegramJsonRequest<T>(url: string, init: RequestInit = {}) {
  let rawResponse: string;

  try {
    const response = await fetch(url, {
      ...init,
      cache: "no-store",
      signal: init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    rawResponse = await response.text();
  } catch {
    rawResponse = await curlText(url, init);
  }

  return JSON.parse(rawResponse) as T;
}

export async function telegramFileRequest(url: string) {
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      return null;
    }

    return {
      bytes: new Uint8Array(await response.arrayBuffer()),
      contentType: response.headers.get("content-type") ?? "image/jpeg",
    };
  } catch {
    return {
      bytes: await curlBuffer(url),
      contentType: "image/jpeg",
    };
  }
}
