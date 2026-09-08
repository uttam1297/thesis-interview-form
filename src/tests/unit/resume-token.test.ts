import { describe, expect, it } from "vitest";

import {
  createResumeToken,
  hashResumeToken,
  isWellFormedResumeToken,
  resumeTokenHashEquals,
} from "@/features/sessions/resume-token";

describe("resume tokens", () => {
  it("mints unguessable, URL-safe tokens", () => {
    const { token } = createResumeToken();
    // 32 random bytes in base64url.
    expect(token).toMatch(/^[A-Za-z0-9_-]{43}$/);

    const tokens = new Set(
      Array.from({ length: 200 }, () => createResumeToken().token)
    );
    expect(tokens.size).toBe(200);
  });

  it("stores only a hash, never the token itself", () => {
    const { token, tokenHash } = createResumeToken();
    expect(tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(tokenHash).not.toContain(token);
    expect(hashResumeToken(token)).toBe(tokenHash);
  });

  it("compares hashes in constant time", () => {
    const { tokenHash } = createResumeToken();
    expect(resumeTokenHashEquals(tokenHash, tokenHash)).toBe(true);
    expect(resumeTokenHashEquals(tokenHash, hashResumeToken("other"))).toBe(
      false
    );
    expect(resumeTokenHashEquals(tokenHash, "short")).toBe(false);
  });

  it("rejects malformed tokens before any database work", () => {
    expect(isWellFormedResumeToken(createResumeToken().token)).toBe(true);
    expect(isWellFormedResumeToken("")).toBe(false);
    expect(isWellFormedResumeToken("short")).toBe(false);
    expect(isWellFormedResumeToken("has spaces and/slashes")).toBe(false);
    expect(isWellFormedResumeToken(null)).toBe(false);
    expect(isWellFormedResumeToken("' or 1=1 --")).toBe(false);
  });
});
