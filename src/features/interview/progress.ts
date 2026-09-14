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
  currentStepId: string,
  experience: "standard" | "journey" = "standard"
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

  if (experience === "journey" && currentStep.kind === "question") {
    const sectionIds = [...new Set(questions.map((step) => step.section.id))];
    const sectionIndex = Math.max(
      sectionIds.indexOf(currentStep.section.id),
      0
    );
    const denominator = Math.max(sectionIds.length - 1, 1);
    return {
      percent: Math.round((sectionIndex / denominator) * 100),
      questionIndex: questions.findIndex(
        (step) => step.question.id === currentStep.question.id
      ),
      questionCount,
    };
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
