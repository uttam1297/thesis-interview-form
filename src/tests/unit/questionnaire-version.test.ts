import { afterEach, describe, expect, it, vi } from "vitest";

import { sessionApi } from "@/features/interview/persistence/server-api";
import { SyncedPersistence } from "@/features/interview/persistence/synced";
import { createInitialState } from "@/features/interview/state";
import { startSession } from "@/features/sessions/session-service";

const { query, rpc } = vi.hoisted(() => {
  const query = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi
      .fn()
      .mockResolvedValue({ data: { id: "study-id" }, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
  return { query, rpc: vi.fn() };
});
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: () => query, rpc }),
}));
vi.mock("@/lib/env", () => ({
  serverEnv: () => ({ STUDY_SLUG: "test-study" }),
}));

afterEach(() => {
  vi.restoreAllMocks();
  vi.clearAllMocks();
  localStorage.clear();
});

describe("questionnaire versions when starting sessions", () => {
  it("requests the version displayed by the participant browser", async () => {
    const start = vi
      .spyOn(sessionApi, "start")
      .mockRejectedValue(new Error("not published"));
    const persistence = new SyncedPersistence();
    const state = createInitialState("questions-new", "2026-09-09T10:00:00Z");
    state.consent = {
      accepted: true,
      version: "consent-v1",
      acceptedAt: state.updatedAt,
    };
    await persistence.save(state);
    expect(start).toHaveBeenCalledWith(
      expect.objectContaining({ questionnaireVersion: "questions-new" })
    );
    expect(persistence.getStatus()).toBe("error");
    expect(persistence.getResumeToken()).toBeNull();
    await persistence.clear();
  });

  it("refuses an unpublished version before creating participant records", async () => {
    await expect(
      startSession({
        questionnaireVersion: "unpublished",
        consentVersion: "c1",
        participationConsent: true,
        recordingConsent: null,
      })
    ).rejects.toThrow("has not been published");
    expect(query.eq).toHaveBeenCalledWith("study_id", "study-id");
    expect(query.eq).toHaveBeenCalledWith("version", "unpublished");
    expect(rpc).not.toHaveBeenCalled();
  });

  it("retains latest-version selection for researcher-created live sessions", async () => {
    await expect(
      startSession({
        consentVersion: "c1",
        participationConsent: true,
        recordingConsent: null,
        responseMode: "live_interview",
      })
    ).rejects.toThrow();
    expect(query.eq).not.toHaveBeenCalledWith("version", expect.anything());
    expect(query.order).toHaveBeenCalledWith("published_at", {
      ascending: false,
    });
  });
});
