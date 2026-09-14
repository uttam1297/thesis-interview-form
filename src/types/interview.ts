/**
 * Research questionnaire configuration types.
 *
 * These describe the *shape* of the instrument. Wording, order, options and
 * branching all live in config data (src/config/questions.json); components
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

export interface OptionalProbe {
  /** Participant-facing follow-up kept on the same logical screen/response. */
  prompt: string;
  /** Optional condition on an earlier answer, for example whether AI was used. */
  showIf?: Condition[];
  /** Hide until the main open response contains a substantive answer. */
  requireSubstantiveAnswer?: boolean;
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
  /** Conversational lead-in shown above the prompt. */
  transition?: string;
  /** Optional supporting text under the prompt. */
  description?: string;
  /**
   * Optional framing shown alongside the question rather than in it — a
   * nudge about how to answer, kept out of the prompt so the research
   * wording stays exactly as written.
   */
  aside?: string;
  required: boolean;
  /** Full analytical construct map. Never rendered to participants. */
  constructs?: string[];
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

/** Open response with explicit, legitimate non-answer states and an optional probe. */
export interface GuidedOpenQuestion extends QuestionBase {
  responseType: "guided_open";
  nonAnswerOptions?: QuestionOption[];
  optionalProbe?: OptionalProbe;
  validation?: TextValidation;
}

/** Multi-select plus optional explanation, kept on one logical screen. */
export interface MultiSelectWithElaborationQuestion extends QuestionBase {
  responseType: "multi_select_with_elaboration";
  options: QuestionOption[];
  allowOther?: boolean;
  elaborationPrompt: string;
  /** Require a meaningful explanation in addition to the selected inputs. */
  elaborationRequired?: boolean;
  validation?: SelectionValidation;
}

export type InterviewQuestion =
  | SingleSelectQuestion
  | MultiSelectQuestion
  | LikertScaleQuestion
  | RankingQuestion
  | ShortTextQuestion
  | LongTextQuestion
  | VoiceOrTextQuestion
  | OptionalElaborationQuestion
  | GuidedOpenQuestion
  | MultiSelectWithElaborationQuestion;

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
  /** Journey mode removes numbered-workload cues and section-intro screens. */
  experience?: "standard" | "journey";
  sections: InterviewSection[];
  questions: InterviewQuestion[];
}

/* ---------- Responses ---------- */

export type ResponseValue =
  | { kind: "single"; value: string; other?: string }
  | { kind: "multi"; values: string[]; other?: string }
  | { kind: "scale"; value: number }
  | { kind: "ranking"; order: string[] }
  | { kind: "text"; text: string }
  | {
      kind: "guided_text";
      text: string;
      nonAnswer?: string;
      optionalElaboration?: string;
    }
  | {
      kind: "multi_elaboration";
      values: string[];
      other?: string;
      optionalElaboration?: string;
    };

/**
 * How an answer was produced. "researcher" marks data entered during a live
 * interview, so exports never present it as the participant's own wording.
 */
export type ResponseMethod = "selected" | "typed" | "voice" | "researcher";

export interface ResponseRecord {
  questionId: string;
  value: ResponseValue | null;
  skipped: boolean;
  method: ResponseMethod;
  updatedAt: string;
}
