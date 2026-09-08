import { describe, expect, it } from "vitest";

import { calculateProgress } from "@/features/interview/progress";
import {
  buildSteps,
  stepIdForQuestion,
  visibleQuestionSteps,
} from "@/features/interview/steps";
import { testConfig } from "@/tests/fixtures/config";
import type { ResponseRecord } from "@/types/interview";

const usesAi = (value: "yes" | "no"): Record<string, ResponseRecord> => ({
  "uses-ai": {
    questionId: "uses-ai",
    value: { kind: "single", value },
    skipped: false,
    method: "selected",
    updatedAt: "now",
  },
});

describe("buildSteps", () => {
  it("starts with welcome and consent, ends with review and complete", () => {
    const steps = buildSteps(testConfig, {});
    expect(steps[0].kind).toBe("welcome");
    expect(steps[1].kind).toBe("consent");
    expect(steps.at(-2)?.kind).toBe("review");
    expect(steps.at(-1)?.kind).toBe("complete");
  });

  it("inserts a section intro before each section that has visible questions", () => {
    const intros = buildSteps(testConfig, {}).filter(
      (s) => s.kind === "section-intro"
    );
    expect(intros.map((s) => s.id)).toEqual([
      "section:profile",
      "section:core",
    ]);
    expect(
      intros[0].kind === "section-intro" && intros[0].completedSection
    ).toBeNull();
    expect(
      intros[1].kind === "section-intro" && intros[1].completedSection?.id
    ).toBe("profile");
  });

  it("numbers each section intro by position among visible sections", () => {
    const intros = buildSteps(testConfig, {}).filter(
      (s) => s.kind === "section-intro"
    );
    expect(intros[0].kind === "section-intro" && intros[0].sectionNumber).toBe(
      1
    );
    expect(intros[1].kind === "section-intro" && intros[1].sectionNumber).toBe(
      2
    );
    expect(intros[1].kind === "section-intro" && intros[1].sectionCount).toBe(
      2
    );
  });

  it("routes to the matching branch and never shows both", () => {
    const yesIds = visibleQuestionSteps(
      buildSteps(testConfig, usesAi("yes"))
    ).map((s) => s.question.id);
    const noIds = visibleQuestionSteps(
      buildSteps(testConfig, usesAi("no"))
    ).map((s) => s.question.id);
    expect(yesIds).toContain("ai-how");
    expect(yesIds).not.toContain("ai-why-not");
    expect(noIds).toContain("ai-why-not");
    expect(noIds).not.toContain("ai-how");
  });
});

describe("calculateProgress", () => {
  it("is 0 before questions and 100 at review", () => {
    const steps = buildSteps(testConfig, usesAi("yes"));
    expect(calculateProgress(steps, "welcome").percent).toBe(0);
    expect(calculateProgress(steps, "review").percent).toBe(100);
  });

  it("reflects position among visible questions", () => {
    const steps = buildSteps(testConfig, usesAi("yes"));
    const total = visibleQuestionSteps(steps).length; // role, uses-ai, ai-how, confidence, tools, priorities, closing
    expect(total).toBe(7);
    expect(calculateProgress(steps, stepIdForQuestion("role")).percent).toBe(0);
    expect(calculateProgress(steps, stepIdForQuestion("ai-how")).percent).toBe(
      Math.round((2 / 7) * 100)
    );
  });

  it("does not move backwards when a branch hides questions", () => {
    const before = calculateProgress(
      buildSteps(testConfig, usesAi("yes")),
      stepIdForQuestion("confidence")
    );
    const after = calculateProgress(
      buildSteps(testConfig, usesAi("no")),
      stepIdForQuestion("confidence")
    );
    expect(after.percent).toBe(before.percent);
  });
});
