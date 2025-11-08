// lib/auth-reset.ts
import crypto from "crypto";

export function generateResetToken() {
  // generate 32-byte token (64 hex chars)
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hashedToken: hash };
}

export function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
