import { describe, expect, it } from "vitest";

import {
  getNextStep,
  getPreviousStep,
  getProgressPercent,
  getStep,
} from "@/features/interview/flow";

describe("interview flow", () => {
  it("resolves next/previous steps in order", () => {
    expect(getNextStep("welcome")?.id).toBe("consent");
    expect(getPreviousStep("consent")?.id).toBe("welcome");
  });

  it("has no previous step before the first step", () => {
    expect(getPreviousStep("welcome")).toBeUndefined();
  });

  it("computes percent complete only across progress-counted steps", () => {
    expect(getProgressPercent("profile")).toBe(33);
    expect(getProgressPercent("question")).toBe(67);
    expect(getProgressPercent("question-choice")).toBe(100);
  });

  it("returns 0 percent for steps that do not count toward progress", () => {
    expect(getProgressPercent("welcome")).toBe(0);
    expect(getProgressPercent("review")).toBe(0);
  });

  it("throws for an unknown step id", () => {
    expect(() => getStep("does-not-exist")).toThrow();
  });
});
