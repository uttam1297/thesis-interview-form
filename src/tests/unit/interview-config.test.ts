import { describe, expect, it } from "vitest";

import { interviewConfig } from "@/config/interview";
import { interviewConfigSchema } from "@/lib/validation/interview-config";
import { testConfig } from "@/tests/fixtures/config";

const baseQuestion = {
  id: "q1",
  construct: "c",
  sectionId: "s1",
  title: "T",
  prompt: "P",
  required: true,
};

function withQuestions(questions: unknown[]) {
  return {
    version: "1",
    sections: [{ id: "s1", label: "Section" }],
    questions,
  };
}

describe("interviewConfigSchema", () => {
  it("accepts the production questionnaire", () => {
    expect(interviewConfigSchema.safeParse(interviewConfig).success).toBe(true);
    expect(interviewConfig.questions.length).toBeGreaterThanOrEqual(16);
  });

  it("accepts the test fixture", () => {
    expect(interviewConfigSchema.safeParse(testConfig).success).toBe(true);
  });

  it("rejects duplicate question ids", () => {
    const result = interviewConfigSchema.safeParse(
      withQuestions([
        { ...baseQuestion, responseType: "short_text" },
        { ...baseQuestion, responseType: "short_text" },
      ])
    );
    expect(result.success).toBe(false);
  });

  it("rejects an unknown section", () => {
    const result = interviewConfigSchema.safeParse(
      withQuestions([
        { ...baseQuestion, sectionId: "nope", responseType: "short_text" },
      ])
    );
    expect(result.success).toBe(false);
  });

  it("rejects a condition that points forward", () => {
    const result = interviewConfigSchema.safeParse(
      withQuestions([
        {
          ...baseQuestion,
          responseType: "short_text",
          showIf: [{ questionId: "later", operator: "answered" }],
        },
        { ...baseQuestion, id: "later", responseType: "short_text" },
      ])
    );
    expect(result.success).toBe(false);
  });

  it("rejects a likert scale with max <= min", () => {
    const result = interviewConfigSchema.safeParse(
      withQuestions([
        { ...baseQuestion, responseType: "likert_scale", min: 5, max: 5 },
      ])
    );
    expect(result.success).toBe(false);
  });

  it("rejects a required optional_elaboration", () => {
    const result = interviewConfigSchema.safeParse(
      withQuestions([
        {
          ...baseQuestion,
          responseType: "optional_elaboration",
          required: true,
        },
      ])
    );
    expect(result.success).toBe(false);
  });
});
