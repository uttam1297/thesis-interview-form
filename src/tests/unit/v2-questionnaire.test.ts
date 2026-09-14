import { describe, expect, it } from "vitest";

import { v1InterviewConfig } from "@/config/questionnaires/v1";
import { v2InterviewConfig } from "@/config/questionnaires/v2";
import { evaluateCondition } from "@/features/interview/conditions";
import { formatAnswer } from "@/features/interview/format-answer";
import { calculateProgress } from "@/features/interview/progress";
import { hashDefinition } from "@/features/questionnaire/definition-hash";
import {
  buildSteps,
  stepIdForQuestion,
  visibleQuestionSteps,
} from "@/features/interview/steps";
import { validateResponse } from "@/features/interview/validate-response";
import type { InterviewQuestion, ResponseRecord } from "@/types/interview";

const expectedIds = [
  "v2_profile_role",
  "v2_profile_experience",
  "v2_profile_industry",
  "v2_profile_decision_involvement",
  "v2_q1_decision_context",
  "v2_q2_decision_inputs",
  "v2_q3_difficulty",
  "v2_q4_validation_governance",
  "v2_q5_outcome_learning",
  "v2_q6_improvement",
  "v2_q7_optional_closing",
];

const expectedCoreConstructs: Record<string, string[]> = {
  v2_q1_decision_context: ["decision_context", "decision_process"],
  v2_q2_decision_inputs: [
    "evidence_use",
    "human_judgement",
    "ai_use",
    "decision_inputs",
  ],
  v2_q3_difficulty: [
    "decision_difficulty",
    "uncertainty",
    "tradeoffs",
    "prioritisation",
    "stakeholder_conflict",
  ],
  v2_q4_validation_governance: [
    "data_quality",
    "verification",
    "ai_trust",
    "human_oversight",
    "governance",
    "security",
    "privacy",
    "compliance",
    "accountability",
    "risk",
  ],
  v2_q5_outcome_learning: ["outcome_measurement", "feedback", "learning"],
  v2_q6_improvement: [
    "design_requirements",
    "process_improvement",
    "unmet_needs",
  ],
};

function question(id: string): InterviewQuestion {
  return v2InterviewConfig.questions.find((item) => item.id === id)!;
}

function response(
  questionId: string,
  value: ResponseRecord["value"]
): ResponseRecord {
  return {
    questionId,
    value,
    skipped: false,
    method: "selected",
    updatedAt: "2026-09-11T00:00:00.000Z",
  };
}

describe("Questionnaire V2 definition", () => {
  it("has exactly four profile, six core, and one optional closing question", () => {
    expect(v2InterviewConfig.version).toBe("v2");
    expect(v2InterviewConfig.experience).toBe("journey");
    expect(v2InterviewConfig.questions.map((item) => item.id)).toEqual(
      expectedIds
    );
    expect(
      v2InterviewConfig.questions.filter((item) =>
        item.id.startsWith("v2_profile_")
      )
    ).toHaveLength(4);
    expect(
      v2InterviewConfig.questions.filter((item) => /^v2_q[1-6]_/.test(item.id))
    ).toHaveLength(6);
    expect(question("v2_q7_optional_closing").required).toBe(false);
  });

  it("never reuses a frozen V1 question id", () => {
    const v1Ids = new Set(v1InterviewConfig.questions.map((item) => item.id));
    expect(expectedIds.every((id) => !v1Ids.has(id))).toBe(true);
  });

  it("keeps the frozen V1 definition byte-for-byte equivalent by hash", () => {
    expect(hashDefinition(v1InterviewConfig)).toBe(
      "97e7ee840e37bde85ab8478d47cb220758a3e510dbb8ef3be69d93b8c969c845"
    );
  });

  it("preserves the full analytical construct map", () => {
    for (const [id, constructs] of Object.entries(expectedCoreConstructs)) {
      expect(question(id).constructs).toEqual(constructs);
    }
  });

  it("keeps Q2 selection and elaboration on one logical question", () => {
    const q2 = question("v2_q2_decision_inputs");
    expect(q2.responseType).toBe("multi_select_with_elaboration");
    if (q2.responseType !== "multi_select_with_elaboration") return;
    expect(q2.elaborationPrompt).toBe("Which of these mattered most, and why?");
    expect(q2.elaborationRequired).toBe(false);
    expect(q2.options.some((option) => option.value === "ai_based_tools")).toBe(
      true
    );
  });
});

describe("Questionnaire V2 behaviour", () => {
  it("uses journey stages without inserting section-intro screens", () => {
    const steps = buildSteps(v2InterviewConfig, {});
    expect(steps.some((step) => step.kind === "section-intro")).toBe(false);
    expect(visibleQuestionSteps(steps)).toHaveLength(11);

    const q4Progress = calculateProgress(
      steps,
      stepIdForQuestion("v2_q4_validation_governance"),
      "journey"
    );
    expect(q4Progress.percent).toBe(67);
  });

  it("shows the Q4 AI probe only when Q2 includes AI-based tools", () => {
    const q4 = question("v2_q4_validation_governance");
    if (q4.responseType !== "guided_open")
      throw new Error("Unexpected Q4 type");
    const condition = q4.optionalProbe?.showIf?.[0];
    expect(condition).toBeDefined();

    const withAi = {
      v2_q2_decision_inputs: response("v2_q2_decision_inputs", {
        kind: "multi_elaboration",
        values: ["data_analytics", "ai_based_tools"],
      }),
    };
    const withoutAi = {
      v2_q2_decision_inputs: response("v2_q2_decision_inputs", {
        kind: "multi_elaboration",
        values: ["data_analytics"],
      }),
    };
    expect(evaluateCondition(condition!, withAi)).toBe(true);
    expect(evaluateCondition(condition!, withoutAi)).toBe(false);
  });

  it("rejects punctuation-only open text without imposing a length minimum", () => {
    const q1 = question("v2_q1_decision_context");
    expect(
      validateResponse(q1, { kind: "guided_text", text: "... -" })
    ).toMatch(/words or numbers/i);
    expect(validateResponse(q1, { kind: "guided_text", text: "A" })).toBeNull();
  });

  it("accepts Q2 selections without an explanation and validates optional text", () => {
    const q2 = question("v2_q2_decision_inputs");
    expect(
      validateResponse(q2, {
        kind: "multi_elaboration",
        values: ["data_analytics"],
      })
    ).toBeNull();
    expect(
      validateResponse(q2, {
        kind: "multi_elaboration",
        values: ["data_analytics"],
        optionalElaboration: "...",
      })
    ).toMatch(/words or numbers/i);
    expect(
      validateResponse(q2, {
        kind: "multi_elaboration",
        values: ["data_analytics"],
        optionalElaboration: "A",
      })
    ).toBeNull();
  });

  it("accepts and accurately formats a structured non-answer", () => {
    const q4 = question("v2_q4_validation_governance");
    const value = {
      kind: "guided_text" as const,
      text: "",
      nonAnswer: "not_applicable_role",
    };
    expect(validateResponse(q4, value)).toBeNull();
    expect(
      formatAnswer(q4, {
        questionId: q4.id,
        value,
        skipped: false,
        method: "selected",
        updatedAt: "2026-09-11T00:00:00.000Z",
      })
    ).toBe("Not applicable to my role");
  });
});
