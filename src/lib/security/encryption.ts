import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

const ALGORITHM = "aes-256-gcm";
const VERSION = "v1";

function buildKey(secret: string) {
  const trimmedSecret = secret.trim();

  if (/^[a-f0-9]{64}$/i.test(trimmedSecret)) {
    return Buffer.from(trimmedSecret, "hex");
  }

  try {
    const decoded = Buffer.from(trimmedSecret, "base64");

    if (decoded.length === 32) {
      return decoded;
    }
  } catch {
    // Fall back to deterministic hashing below.
  }

  return createHash("sha256").update(trimmedSecret).digest();
}

export function encryptSecret(value: string, secret: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, buildKey(secret), iv);
  const encrypted = Buffer.concat([
    cipher.update(value, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    VERSION,
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptSecret(value: string, secret: string) {
  const [version, iv, authTag, encrypted] = value.split(".");

  if (version !== VERSION || !iv || !authTag || !encrypted) {
    throw new Error("Invalid encrypted secret format.");
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    buildKey(secret),
    Buffer.from(iv, "base64url"),
  );

  decipher.setAuthTag(Buffer.from(authTag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}
