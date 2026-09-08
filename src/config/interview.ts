import { interviewQuestionListSchema } from "@/lib/validation/question";
import type { InterviewQuestion, QuestionType } from "@/types/interview";

/**
 * Placeholder question set for the Phase 1 static prototype only.
 *
 * This is fake data used to prove the config-driven rendering pattern and
 * to exercise each response-type component. The real research instrument
 * (wording, order, sections, conditional logic) is authored in Phase 2 and
 * will replace this file's contents without any component changes.
 */
const demoQuestions: InterviewQuestion[] = [
  {
    id: "demo-role",
    construct: "participant_profile",
    section: "About you",
    title: "Current role",
    question: "Which best describes your current role?",
    required: true,
    type: "single_select",
    options: [
      { value: "product_manager", label: "Product Manager" },
      { value: "product_analyst", label: "Product Analyst" },
      { value: "ux_researcher", label: "UX Researcher" },
      { value: "data_analyst", label: "Data Analyst" },
    ],
  },
  {
    id: "demo-tools",
    construct: "current_practice",
    section: "How decisions happen",
    title: "Tools in use",
    question: "Which tools do you currently rely on for product decisions?",
    required: false,
    type: "multi_select",
    options: [
      { value: "analytics_platform", label: "Analytics platform" },
      { value: "spreadsheets", label: "Spreadsheets" },
      { value: "ai_assistant", label: "AI assistant" },
      { value: "customer_interviews", label: "Customer interviews" },
    ],
  },
  {
    id: "demo-confidence",
    construct: "data_quality",
    section: "Data and AI",
    title: "Confidence in data",
    question:
      "How confident are you, in general, that the data available to you is reliable?",
    required: true,
    type: "scale",
    min: 1,
    max: 5,
    minLabel: "Not confident",
    maxLabel: "Very confident",
  },
  {
    id: "demo-data-quality",
    construct: "data_quality",
    section: "Data and AI",
    title: "Data quality",
    question:
      "How do you determine whether the available data is reliable enough to support a decision?",
    required: false,
    voiceEnabled: true,
    type: "long_text",
  },
];

export const interviewQuestions: InterviewQuestion[] =
  interviewQuestionListSchema.parse(demoQuestions);

export function getQuestionById(id: string): InterviewQuestion | undefined {
  return interviewQuestions.find((q) => q.id === id);
}

/**
 * Looks up a question and asserts its response type, returning it narrowed
 * to that variant. TypeScript's control-flow narrowing from a standalone
 * `if (question.type !== "x") throw` does not survive being read from
 * inside a separately-defined component function, so callers that need a
 * specific variant's fields (options, min/max, ...) use this instead.
 */
export function requireQuestion<T extends QuestionType>(
  id: string,
  type: T
): Extract<InterviewQuestion, { type: T }> {
  const question = getQuestionById(id);
  if (!question || question.type !== type) {
    throw new Error(`Expected question "${id}" to have type "${type}"`);
  }
  return question as Extract<InterviewQuestion, { type: T }>;
}
