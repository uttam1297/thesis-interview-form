import { describe, expect, it } from "vitest";

import { interviewQuestionListSchema } from "@/lib/validation/question";

describe("interviewQuestionListSchema", () => {
  it("accepts a valid mixed-type question set", () => {
    const result = interviewQuestionListSchema.safeParse([
      {
        id: "q1",
        construct: "role",
        section: "About you",
        title: "Role",
        question: "What is your role?",
        required: true,
        type: "single_select",
        options: [
          { value: "pm", label: "Product Manager" },
          { value: "ux", label: "UX Researcher" },
        ],
      },
      {
        id: "q2",
        construct: "confidence",
        section: "Data and AI",
        title: "Confidence",
        question: "How confident are you?",
        required: true,
        type: "scale",
        min: 1,
        max: 5,
      },
    ]);

    expect(result.success).toBe(true);
  });

  it("rejects a scale question whose max is not greater than min", () => {
    const result = interviewQuestionListSchema.safeParse([
      {
        id: "q1",
        construct: "confidence",
        section: "Data and AI",
        title: "Confidence",
        question: "How confident are you?",
        required: true,
        type: "scale",
        min: 5,
        max: 5,
      },
    ]);

    expect(result.success).toBe(false);
  });

  it("rejects a single_select question with fewer than two options", () => {
    const result = interviewQuestionListSchema.safeParse([
      {
        id: "q1",
        construct: "role",
        section: "About you",
        title: "Role",
        question: "What is your role?",
        required: true,
        type: "single_select",
        options: [{ value: "pm", label: "Product Manager" }],
      },
    ]);

    expect(result.success).toBe(false);
  });
});
