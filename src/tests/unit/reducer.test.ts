import { describe, expect, it } from "vitest";

import {
  createInterviewReducer,
  type InterviewAction,
} from "@/features/interview/reducer";
import {
  createInitialState,
  type InterviewState,
} from "@/features/interview/state";
import { stepIdForQuestion } from "@/features/interview/steps";
import { fixedNow, testConfig } from "@/tests/fixtures/config";

const reduce = createInterviewReducer(testConfig);

function run(
  actions: InterviewAction[],
  from = createInitialState(testConfig.version, fixedNow)
) {
  return actions.reduce(reduce, from);
}

const now = fixedNow;
const start: InterviewAction[] = [
  { type: "START", now },
  { type: "ACCEPT_CONSENT", consentVersion: "v1", now },
];
const answerSingle = (questionId: string, value: string): InterviewAction => ({
  type: "ANSWER",
  questionId,
  value: { kind: "single", value },
  method: "selected",
  now,
});

describe("interview reducer", () => {
  it("START moves to consent and stamps startedAt once", () => {
    const state = run([{ type: "START", now }]);
    expect(state.currentStepId).toBe("consent");
    expect(state.startedAt).toBe(now);
    expect(state.status).toBe("in_progress");
  });

  it("ACCEPT_CONSENT records consent and advances to the first section intro", () => {
    const state = run(start);
    expect(state.consent).toEqual({
      accepted: true,
      version: "v1",
      acceptedAt: now,
    });
    expect(state.currentStepId).toBe("section:profile");
  });

  it("NEXT / BACK walk the step list and BACK keeps answers", () => {
    let state = run([...start, { type: "NEXT", now }]);
    expect(state.currentStepId).toBe(stepIdForQuestion("role"));

    state = run(
      [
        answerSingle("role", "pm"),
        { type: "NEXT", now },
        { type: "BACK", now },
      ],
      state
    );
    expect(state.currentStepId).toBe(stepIdForQuestion("role"));
    expect(state.responses.role.value).toEqual({ kind: "single", value: "pm" });
  });

  it("BACK never returns to consent once accepted", () => {
    const state = run([...start, { type: "BACK", now }]);
    expect(state.currentStepId).toBe("section:profile");
  });

  it("SKIP marks the record skipped but preserves any typed value", () => {
    const state = run([
      ...start,
      {
        type: "ANSWER",
        questionId: "closing",
        value: { kind: "text", text: "draft" },
        method: "typed",
        now,
      },
      { type: "SKIP", questionId: "closing", now },
    ]);
    expect(state.responses.closing.skipped).toBe(true);
    expect(state.responses.closing.value).toEqual({
      kind: "text",
      text: "draft",
    });
  });

  it("changing an earlier answer re-routes later steps without losing hidden answers", () => {
    let state = run([
      ...start,
      { type: "NEXT", now },
      answerSingle("role", "pm"),
      { type: "NEXT", now },
      answerSingle("uses-ai", "yes"),
      { type: "NEXT", now }, // section:core
      { type: "NEXT", now }, // ai-how
    ]);
    expect(state.currentStepId).toBe(stepIdForQuestion("ai-how"));

    state = run(
      [
        {
          type: "ANSWER",
          questionId: "ai-how",
          value: { kind: "text", text: "Summaries" },
          method: "typed",
          now,
        },
        {
          type: "GO_TO_QUESTION",
          questionId: "uses-ai",
          fromReview: false,
          now,
        },
        answerSingle("uses-ai", "no"),
        { type: "NEXT", now },
        { type: "NEXT", now },
      ],
      state
    );
    expect(state.currentStepId).toBe(stepIdForQuestion("ai-why-not"));
    // The now-hidden answer is retained, not deleted.
    expect(state.responses["ai-how"].value).toEqual({
      kind: "text",
      text: "Summaries",
    });
  });

  it("editing from review returns to review on NEXT", () => {
    let state = run([...start, { type: "GO_TO_REVIEW", now }]);
    state = run(
      [{ type: "GO_TO_QUESTION", questionId: "role", fromReview: true, now }],
      state
    );
    expect(state.currentStepId).toBe(stepIdForQuestion("role"));
    expect(state.returnToReview).toBe(true);

    state = run(
      [answerSingle("role", "analyst"), { type: "NEXT", now }],
      state
    );
    expect(state.currentStepId).toBe("review");
    expect(state.returnToReview).toBe(false);
  });

  it("SUBMIT_SUCCESS completes the interview and RESET clears it", () => {
    const submitted = run([
      ...start,
      { type: "SUBMIT_SUCCESS", participantRef: "P001", now },
    ]);
    expect(submitted.status).toBe("submitted");
    expect(submitted.currentStepId).toBe("complete");
    expect(submitted.participantRef).toBe("P001");

    const reset: InterviewState = reduce(submitted, { type: "RESET", now });
    expect(reset).toEqual(createInitialState(testConfig.version, now));
  });
});
