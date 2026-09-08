import {
  findStepIndex,
  visibleQuestionSteps,
  type Step,
} from "@/features/interview/steps";

export interface Progress {
  /** 0–100, based on position among currently visible questions. */
  percent: number;
  questionIndex: number;
  questionCount: number;
}

/**
 * Percent complete for the current step. Position-based rather than
 * answer-count-based so it never moves backwards when an optional question
 * is skipped, and so section intros/review show the surrounding value.
 */
export function calculateProgress(
  steps: Step[],
  currentStepId: string
): Progress {
  const questions = visibleQuestionSteps(steps);
  const questionCount = questions.length;
  if (questionCount === 0)
    return { percent: 0, questionIndex: 0, questionCount: 0 };

  const currentIndex = findStepIndex(steps, currentStepId);
  const currentStep = steps[currentIndex];

  if (
    !currentStep ||
    currentStep.kind === "welcome" ||
    currentStep.kind === "consent"
  ) {
    return { percent: 0, questionIndex: 0, questionCount };
  }
  if (currentStep.kind === "review" || currentStep.kind === "complete") {
    return { percent: 100, questionIndex: questionCount, questionCount };
  }

  // Number of question steps strictly before the current step.
  const answeredBefore = steps
    .slice(0, currentIndex)
    .filter((s) => s.kind === "question").length;

  return {
    percent: Math.round((answeredBefore / questionCount) * 100),
    questionIndex: answeredBefore,
    questionCount,
  };
}
