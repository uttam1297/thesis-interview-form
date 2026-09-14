import { describe, expect, it } from "vitest";

import { interviewConfig } from "@/config/interview";
import { buildSteps } from "@/features/interview/steps";
import {
  compileQuestions,
  parseQuestionText,
} from "@/features/questionnaire/import-questions";

describe("questionnaire import", () => {
  it("turns question text into a complete interview with defaults", () => {
    const config = compileQuestions(["What do you do?", "What would help?"]);
    expect(config.questions[0]).toMatchObject({
      id: "q1",
      prompt: "What do you do?",
      required: true,
      responseType: "voice_or_text",
      construct: "general",
    });
    expect(buildSteps(config, {}).map((s) => s.kind)).toEqual([
      "welcome",
      "consent",
      "section-intro",
      "question",
      "question",
      "review",
      "complete",
    ]);
  });

  it("preserves the existing published definition exactly", () => {
    expect(compileQuestions(interviewConfig)).toEqual(interviewConfig);
  });

  it("creates repeatable versions which change when content changes", () => {
    expect(compileQuestions(["First?"]).version).toBe(
      compileQuestions(["First?"]).version
    );
    expect(compileQuestions(["First?"]).version).not.toBe(
      compileQuestions(["Second?"]).version
    );
  });

  it("handles headings, list markers, Unicode and Windows newlines", () => {
    const config = compileQuestions(
      parseQuestionText(
        "\uFEFF# About you\r\n1. What is your role?\r\n\r\n## Experience\r\n- Was würdest du ändern?"
      )
    );
    expect(config.sections.map((s) => s.label)).toEqual([
      "About you",
      "Experience",
    ]);
    expect(config.questions.map((q) => q.prompt)).toEqual([
      "What is your role?",
      "Was würdest du ändern?",
    ]);
  });

  it("uses explicit options and branches in the existing engine", () => {
    const config = compileQuestions({
      questions: [
        {
          id: "use",
          prompt: "Do you use it?",
          responseType: "single_select",
          options: ["Yes", "No"],
        },
        {
          id: "why",
          prompt: "Why?",
          responseType: "optional_elaboration",
          parentQuestionId: "use",
          showIf: [{ questionId: "use", operator: "equals", value: "Yes" }],
        },
      ],
    });
    expect(config.questions[1].required).toBe(false);
    expect(
      buildSteps(config, {}).filter((s) => s.kind === "question")
    ).toHaveLength(1);
    expect(
      buildSteps(config, {
        use: {
          questionId: "use",
          value: { kind: "single", value: "Yes" },
          skipped: false,
          method: "selected",
          updatedAt: "",
        },
      }).filter((s) => s.kind === "question")
    ).toHaveLength(2);
  });

  it.each(
    [
      [],
      [" "],
      [{ prompt: "Pick", responseType: "single_select" }],
      [
        {
          prompt: "Pick",
          responseType: "single_select",
          options: ["Same", "Same"],
        },
      ],
      [
        {
          prompt: "Pick",
          responseType: "multi_select",
          options: ["A", "B"],
          validation: { minSelections: 3 },
        },
      ],
      [{ prompt: "Text", validation: { minLength: 20, maxLength: 10 } }],
      [{ prompt: "Scale", responseType: "likert_scale", min: 5, max: 1 }],
      [{ prompt: "Typo", requried: false }],
      [
        {
          prompt: "Wrong type",
          responseType: "long_text",
          options: ["A", "B"],
        },
      ],
      [
        { id: "same", prompt: "One?" },
        { id: "same", prompt: "Two?" },
      ],
      [
        {
          prompt: "Why?",
          showIf: [{ questionId: "later", operator: "answered" }],
        },
      ],
      [
        { id: "q1", prompt: "One?" },
        { prompt: "Two?", showIf: [{ questionId: "q1", operator: "equals" }] },
      ],
    ].map((input) => ({ input }))
  )("rejects invalid input %#", ({ input }) => {
    expect(() => compileQuestions(input)).toThrow();
  });

  it("rejects duplicate sections and section ordering that breaks branching", () => {
    expect(() =>
      compileQuestions({
        sections: [
          { id: "s", label: "A" },
          { id: "s", label: "B" },
        ],
        questions: ["Q?"],
      })
    ).toThrow();
    expect(() =>
      compileQuestions({
        sections: [
          { id: "a", label: "A" },
          { id: "b", label: "B" },
        ],
        questions: [
          { id: "q1", prompt: "First?", sectionId: "b" },
          {
            prompt: "Second?",
            sectionId: "a",
            showIf: [{ questionId: "q1", operator: "answered" }],
          },
        ],
      })
    ).toThrow();
  });
});
