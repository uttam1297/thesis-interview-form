import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { InterviewProvider } from "@/features/interview/interview-provider";
import {
  MemoryDraftStorage,
  MemorySubmissionRepository,
} from "@/features/interview/persistence/memory";
import { stepIdForQuestion } from "@/features/interview/steps";
import { useInterview } from "@/features/interview/use-interview";
import { fixedNow, testConfig } from "@/tests/fixtures/config";

function setup(
  drafts = new MemoryDraftStorage(),
  submissions = new MemorySubmissionRepository()
) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <InterviewProvider
      config={testConfig}
      persistence={{ drafts, submissions }}
      now={() => fixedNow}
    >
      {children}
    </InterviewProvider>
  );
  const hook = renderHook(() => useInterview(), { wrapper });
  return { ...hook, drafts, submissions };
}

describe("InterviewProvider", () => {
  it("autosaves in-progress state to draft storage", async () => {
    const { result, drafts } = setup();
    await waitFor(() => expect(result.current.hydrated).toBe(true));

    act(() => result.current.dispatch({ type: "START" }));
    act(() =>
      result.current.dispatch({ type: "ACCEPT_CONSENT", consentVersion: "v1" })
    );

    await waitFor(() =>
      expect(drafts.draft?.currentStepId).toBe("section:profile")
    );
  });

  it("offers a saved draft and resumes it at the same step with answers intact", async () => {
    const drafts = new MemoryDraftStorage();
    const first = setup(drafts);
    await waitFor(() => expect(first.result.current.hydrated).toBe(true));
    act(() => first.result.current.dispatch({ type: "START" }));
    act(() =>
      first.result.current.dispatch({
        type: "ACCEPT_CONSENT",
        consentVersion: "v1",
      })
    );
    act(() => first.result.current.dispatch({ type: "NEXT" }));
    act(() =>
      first.result.current.dispatch({
        type: "ANSWER",
        questionId: "role",
        value: { kind: "single", value: "pm" },
        method: "selected",
      })
    );
    await waitFor(() => expect(drafts.draft?.responses.role).toBeDefined());
    first.unmount();

    // "Refresh": a new provider against the same storage.
    const second = setup(drafts);
    await waitFor(() =>
      expect(second.result.current.pendingDraft).not.toBeNull()
    );
    expect(second.result.current.currentStep.kind).toBe("welcome");

    act(() => second.result.current.resumeDraft());
    expect(second.result.current.state.currentStepId).toBe(
      stepIdForQuestion("role")
    );
    expect(second.result.current.state.responses.role.value).toEqual({
      kind: "single",
      value: "pm",
    });
  });

  it("discarding a draft clears storage and starts fresh", async () => {
    const drafts = new MemoryDraftStorage();
    drafts.draft = {
      version: testConfig.version,
      status: "in_progress",
      consent: null,
      responses: {},
      currentStepId: "consent",
      returnToReview: false,
      startedAt: fixedNow,
      updatedAt: fixedNow,
      submittedAt: null,
      participantRef: null,
    };
    const { result } = setup(drafts);
    await waitFor(() => expect(result.current.pendingDraft).not.toBeNull());

    act(() => result.current.discardDraft());
    expect(result.current.pendingDraft).toBeNull();
    expect(drafts.draft).toBeNull();
    expect(result.current.state.currentStepId).toBe("welcome");
  });

  it("ignores drafts from another questionnaire version", async () => {
    const drafts = new MemoryDraftStorage();
    drafts.draft = {
      version: "old",
      status: "in_progress",
      consent: null,
      responses: {},
      currentStepId: "consent",
      returnToReview: false,
      startedAt: fixedNow,
      updatedAt: fixedNow,
      submittedAt: null,
      participantRef: null,
    };
    const { result } = setup(drafts);
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    expect(result.current.pendingDraft).toBeNull();
  });

  it("submits through the repository, clears the draft and records the reference", async () => {
    const { result, drafts, submissions } = setup();
    await waitFor(() => expect(result.current.hydrated).toBe(true));
    act(() => result.current.dispatch({ type: "START" }));
    act(() =>
      result.current.dispatch({ type: "ACCEPT_CONSENT", consentVersion: "v1" })
    );
    act(() =>
      result.current.dispatch({
        type: "ANSWER",
        questionId: "role",
        value: { kind: "single", value: "pm" },
        method: "selected",
      })
    );

    await act(() => result.current.submit());

    expect(submissions.submissions).toHaveLength(1);
    expect(submissions.submissions[0].responses[0]).toMatchObject({
      questionId: "role",
      construct: "profile",
      sectionId: "profile",
    });
    expect(result.current.state.status).toBe("submitted");
    expect(result.current.state.participantRef).toBe("P001");
    expect(drafts.draft).toBeNull();
  });
});
