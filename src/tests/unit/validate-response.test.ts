import { describe, expect, it } from "vitest";

import { formatAnswer } from "@/features/interview/format-answer";
import {
  OTHER_VALUE,
  validateResponse,
} from "@/features/interview/validate-response";
import { testConfig } from "@/tests/fixtures/config";
import type { InterviewQuestion } from "@/types/interview";

const q = (id: string): InterviewQuestion =>
  testConfig.questions.find((x) => x.id === id)!;

describe("validateResponse", () => {
  it("requires an answer for required questions and not for optional ones", () => {
    expect(validateResponse(q("role"), null)).not.toBeNull();
    expect(validateResponse(q("tools"), null)).toBeNull();
  });

  it("requires the 'Other' text when Other is chosen", () => {
    expect(
      validateResponse(q("role"), { kind: "single", value: OTHER_VALUE })
    ).not.toBeNull();
    expect(
      validateResponse(q("role"), {
        kind: "single",
        value: OTHER_VALUE,
        other: "Founder",
      })
    ).toBeNull();
  });

  it("checks likert bounds", () => {
    expect(
      validateResponse(q("confidence"), { kind: "scale", value: 9 })
    ).not.toBeNull();
    expect(
      validateResponse(q("confidence"), { kind: "scale", value: 3 })
    ).toBeNull();
  });

  it("requires a complete ranking", () => {
    expect(
      validateResponse(q("priorities"), { kind: "ranking", order: ["impact"] })
    ).not.toBeNull();
    expect(
      validateResponse(q("priorities"), {
        kind: "ranking",
        order: ["effort", "impact"],
      })
    ).toBeNull();
  });

  it("treats whitespace-only text as empty for required text", () => {
    expect(
      validateResponse(q("ai-how"), { kind: "text", text: "   " })
    ).not.toBeNull();
    expect(
      validateResponse(q("ai-how"), { kind: "text", text: "We use it daily" })
    ).toBeNull();
  });
});

describe("formatAnswer", () => {
  it("resolves option labels and Other text", () => {
    expect(
      formatAnswer(q("role"), {
        questionId: "role",
        value: { kind: "single", value: OTHER_VALUE, other: "Founder" },
        skipped: false,
        method: "selected",
        updatedAt: "",
      })
    ).toBe("Other: Founder");
  });

  it("labels skipped and missing answers", () => {
    expect(formatAnswer(q("tools"), undefined)).toBe("Not answered");
    expect(
      formatAnswer(q("tools"), {
        questionId: "tools",
        value: null,
        skipped: true,
        method: "selected",
        updatedAt: "",
      })
    ).toBe("Skipped");
  });
});
