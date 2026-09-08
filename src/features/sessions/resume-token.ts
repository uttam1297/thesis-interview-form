import "server-only";

import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Resume tokens are bearer credentials: whoever holds one can continue that
 * participant's session. They are 32 random bytes (256 bits, not guessable
 * or enumerable) and only their SHA-256 hash is stored, so a database dump
 * does not yield working resume links.
 */

const TOKEN_BYTES = 32;

export function createResumeToken(): { token: string; tokenHash: string } {
  const token = randomBytes(TOKEN_BYTES).toString("base64url");
  return { token, tokenHash: hashResumeToken(token) };
}

export function hashResumeToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Constant-time comparison, for paths that compare hashes in application code. */
export function resumeTokenHashEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a, "utf8");
  const bufferB = Buffer.from(b, "utf8");
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}

/** Rejects obviously malformed tokens before touching the database. */
export function isWellFormedResumeToken(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{20,100}$/.test(token);
}
