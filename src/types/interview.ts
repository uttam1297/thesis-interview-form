/**
 * Research questionnaire configuration types.
 *
 * These describe the *shape* of the instrument. Wording, order, options and
 * branching all live in config data (src/config/interview.ts); components
 * only ever receive a question object and render it.
 */

export interface QuestionOption {
  value: string;
  label: string;
}

export type ConditionOperator =
  | "equals"
  | "not_equals"
  | "includes"
  | "not_includes"
  | "answered"
  | "not_answered";

/** A single predicate over an earlier answer. All conditions must hold. */
export interface Condition {
  questionId: string;
  operator: ConditionOperator;
  value?: string;
}

export interface ResearchMetadata {
  /** Thesis research questions this item provides evidence for (RQ1…). */
  researchQuestions?: string[];
  /** Follow-up probes for live interviews; not shown to participants. */
  probes?: string[];
}

export interface SelectionValidation {
  minSelections?: number;
  maxSelections?: number;
}

export interface TextValidation {
  minLength?: number;
  maxLength?: number;
}

interface QuestionBase {
  id: string;
  /** Research construct measured, for analysis/export. */
  construct: string;
  sectionId: string;
  /** Short label for review/summary views. */
  title: string;
  /** The question shown to the participant. */
  prompt: string;
  /** Optional supporting text under the prompt. */
  description?: string;
  required: boolean;
  /** Question is shown only when every condition holds. */
  showIf?: Condition[];
  researchMetadata?: ResearchMetadata;
}

export interface SingleSelectQuestion extends QuestionBase {
  responseType: "single_select";
  options: QuestionOption[];
  allowOther?: boolean;
}

export interface MultiSelectQuestion extends QuestionBase {
  responseType: "multi_select";
  options: QuestionOption[];
  allowOther?: boolean;
  validation?: SelectionValidation;
}

export interface LikertScaleQuestion extends QuestionBase {
  responseType: "likert_scale";
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
}

export interface RankingQuestion extends QuestionBase {
  responseType: "ranking";
  options: QuestionOption[];
}

export interface ShortTextQuestion extends QuestionBase {
  responseType: "short_text";
  validation?: TextValidation;
}

export interface LongTextQuestion extends QuestionBase {
  responseType: "long_text";
  validation?: TextValidation;
}

/** Long text where the participant may dictate instead of typing. */
export interface VoiceOrTextQuestion extends QuestionBase {
  responseType: "voice_or_text";
  validation?: TextValidation;
}

/** Always-optional open follow-up, typically attached to a parent question. */
export interface OptionalElaborationQuestion extends QuestionBase {
  responseType: "optional_elaboration";
  required: false;
  parentQuestionId?: string;
  validation?: TextValidation;
}

export type InterviewQuestion =
  | SingleSelectQuestion
  | MultiSelectQuestion
  | LikertScaleQuestion
  | RankingQuestion
  | ShortTextQuestion
  | LongTextQuestion
  | VoiceOrTextQuestion
  | OptionalElaborationQuestion;

export type ResponseType = InterviewQuestion["responseType"];

export type QuestionOfType<T extends ResponseType> = Extract<
  InterviewQuestion,
  { responseType: T }
>;

export interface InterviewSection {
  id: string;
  /** Human-facing label, e.g. "Data and AI" — never "Section 3". */
  label: string;
  /** Short lead-in shown on the section transition screen. */
  intro?: string;
  estimatedMinutes?: number;
}

export interface InterviewConfig {
  /** Bump when questions change; drafts from another version are discarded. */
  version: string;
  sections: InterviewSection[];
  questions: InterviewQuestion[];
}

/* ---------- Responses ---------- */

export type ResponseValue =
  | { kind: "single"; value: string; other?: string }
  | { kind: "multi"; values: string[]; other?: string }
  | { kind: "scale"; value: number }
  | { kind: "ranking"; order: string[] }
  | { kind: "text"; text: string };

export type ResponseMethod = "selected" | "typed" | "voice";

export interface ResponseRecord {
  questionId: string;
  value: ResponseValue | null;
  skipped: boolean;
  method: ResponseMethod;
  updatedAt: string;
}
