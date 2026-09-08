import { isQuestionVisible } from "@/features/interview/conditions";
import type {
  InterviewConfig,
  InterviewQuestion,
  InterviewSection,
  ResponseRecord,
} from "@/types/interview";

/**
 * The interview is a linear list of steps *derived* from config + answers.
 * Nothing about ordering or branching is stored in state, so changing an
 * earlier answer re-routes later steps automatically and going back never
 * discards anything.
 */
export type Step =
  | { kind: "welcome"; id: "welcome" }
  | { kind: "consent"; id: "consent" }
  | {
      kind: "section-intro";
      id: string;
      section: InterviewSection;
      completedSection: InterviewSection | null;
      /** 1-based position among the sections this participant will see. */
      sectionNumber: number;
      sectionCount: number;
    }
  | {
      kind: "question";
      id: string;
      question: InterviewQuestion;
      section: InterviewSection;
    }
  | { kind: "review"; id: "review" }
  | { kind: "complete"; id: "complete" };

export function stepIdForQuestion(questionId: string): string {
  return `question:${questionId}`;
}

export function stepIdForSectionIntro(sectionId: string): string {
  return `section:${sectionId}`;
}

export function buildSteps(
  config: InterviewConfig,
  responses: Record<string, ResponseRecord>
): Step[] {
  const steps: Step[] = [
    { kind: "welcome", id: "welcome" },
    { kind: "consent", id: "consent" },
  ];

  const visibleQuestions = config.questions.filter((q) =>
    isQuestionVisible(q, responses)
  );
  const sectionsWithQuestions = config.sections.filter((section) =>
    visibleQuestions.some((q) => q.sectionId === section.id)
  );

  sectionsWithQuestions.forEach((section, index) => {
    steps.push({
      kind: "section-intro",
      id: stepIdForSectionIntro(section.id),
      section,
      completedSection: index === 0 ? null : sectionsWithQuestions[index - 1],
      sectionNumber: index + 1,
      sectionCount: sectionsWithQuestions.length,
    });

    visibleQuestions
      .filter((q) => q.sectionId === section.id)
      .forEach((question) => {
        steps.push({
          kind: "question",
          id: stepIdForQuestion(question.id),
          question,
          section,
        });
      });
  });

  steps.push({ kind: "review", id: "review" });
  steps.push({ kind: "complete", id: "complete" });
  return steps;
}

export function findStepIndex(steps: Step[], stepId: string): number {
  return steps.findIndex((s) => s.id === stepId);
}

export function visibleQuestionSteps(
  steps: Step[]
): Extract<Step, { kind: "question" }>[] {
  return steps.filter(
    (s): s is Extract<Step, { kind: "question" }> => s.kind === "question"
  );
}
