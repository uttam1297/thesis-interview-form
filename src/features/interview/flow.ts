/**
 * Static ordering of the Phase 1 mock screens. This is the one place that
 * knows "what comes after what" — pages read from it instead of hardcoding
 * hrefs, and the Phase 2 interview engine replaces this file's contents
 * (real branching/conditional order) without pages changing.
 */

export interface FlowStep {
  id: string;
  path: string;
  /** Human-facing section label, shown in progress/section UI. */
  section?: string;
  /** Whether this step counts toward the percent-complete indicator. */
  countsTowardProgress: boolean;
}

export const flowSteps: FlowStep[] = [
  { id: "welcome", path: "/interview/welcome", countsTowardProgress: false },
  { id: "consent", path: "/interview/consent", countsTowardProgress: false },
  {
    id: "profile",
    path: "/interview/profile",
    section: "About you",
    countsTowardProgress: true,
  },
  {
    id: "section-transition",
    path: "/interview/section-transition",
    countsTowardProgress: false,
  },
  {
    id: "question",
    path: "/interview/question",
    section: "Data and AI",
    countsTowardProgress: true,
  },
  {
    id: "question-choice",
    path: "/interview/question-choice",
    section: "How decisions happen",
    countsTowardProgress: true,
  },
  { id: "review", path: "/interview/review", countsTowardProgress: false },
  { id: "complete", path: "/interview/complete", countsTowardProgress: false },
];

function stepIndex(id: string): number {
  const index = flowSteps.findIndex((step) => step.id === id);
  if (index === -1) throw new Error(`Unknown flow step: ${id}`);
  return index;
}

export function getStep(id: string): FlowStep {
  return flowSteps[stepIndex(id)];
}

export function getPreviousStep(id: string): FlowStep | undefined {
  return flowSteps[stepIndex(id) - 1];
}

export function getNextStep(id: string): FlowStep | undefined {
  return flowSteps[stepIndex(id) + 1];
}

/** Percent complete (0–100), counting only steps flagged countsTowardProgress. */
export function getProgressPercent(id: string): number {
  const progressSteps = flowSteps.filter((s) => s.countsTowardProgress);
  const position = progressSteps.findIndex((s) => s.id === id);
  if (position === -1) return 0;
  return Math.round(((position + 1) / progressSteps.length) * 100);
}
