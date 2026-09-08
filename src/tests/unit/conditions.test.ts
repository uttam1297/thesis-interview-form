import { describe, expect, it } from "vitest";

import {
  evaluateCondition,
  isQuestionVisible,
} from "@/features/interview/conditions";
import { testConfig } from "@/tests/fixtures/config";
import type { ResponseRecord } from "@/types/interview";

function record(
  questionId: string,
  value: ResponseRecord["value"],
  skipped = false
): ResponseRecord {
  return { questionId, value, skipped, method: "selected", updatedAt: "now" };
}

describe("evaluateCondition", () => {
  it("handles equals / not_equals on single answers", () => {
    const responses = { q: record("q", { kind: "single", value: "yes" }) };
    expect(
      evaluateCondition(
        { questionId: "q", operator: "equals", value: "yes" },
        responses
      )
    ).toBe(true);
    expect(
      evaluateCondition(
        { questionId: "q", operator: "not_equals", value: "yes" },
        responses
      )
    ).toBe(false);
  });

  it("handles includes / not_includes on multi answers", () => {
    const responses = { q: record("q", { kind: "multi", values: ["a", "b"] }) };
    expect(
      evaluateCondition(
        { questionId: "q", operator: "includes", value: "a" },
        responses
      )
    ).toBe(true);
    expect(
      evaluateCondition(
        { questionId: "q", operator: "not_includes", value: "c" },
        responses
      )
    ).toBe(true);
  });

  it("treats skipped and empty-text answers as not answered", () => {
    const responses = {
      s: record("s", { kind: "single", value: "yes" }, true),
      t: record("t", { kind: "text", text: "   " }),
    };
    expect(
      evaluateCondition({ questionId: "s", operator: "answered" }, responses)
    ).toBe(false);
    expect(
      evaluateCondition(
        { questionId: "t", operator: "not_answered" },
        responses
      )
    ).toBe(true);
    expect(
      evaluateCondition(
        { questionId: "missing", operator: "equals", value: "x" },
        responses
      )
    ).toBe(false);
  });
});

describe("isQuestionVisible", () => {
  const aiHow = testConfig.questions.find((q) => q.id === "ai-how")!;
  const aiWhyNot = testConfig.questions.find((q) => q.id === "ai-why-not")!;

  it("shows the branch matching the earlier answer and hides the other", () => {
    const yes = {
      "uses-ai": record("uses-ai", { kind: "single", value: "yes" }),
    };
    expect(isQuestionVisible(aiHow, yes)).toBe(true);
    expect(isQuestionVisible(aiWhyNot, yes)).toBe(false);
  });

  it("hides both branches until the gating question is answered", () => {
    expect(isQuestionVisible(aiHow, {})).toBe(false);
    expect(isQuestionVisible(aiWhyNot, {})).toBe(false);
  });
});
