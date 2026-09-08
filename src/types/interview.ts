/**
 * Research question configuration types.
 *
 * These describe the *shape* of a question, not how it renders or how the
 * interview flow sequences questions — that belongs to the interview engine
 * (Phase 2) and to response components (which switch on `type`). Wording,
 * order, and options all live in config data, never inside a component.
 */

export interface QuestionOption {
  value: string;
  label: string;
}

interface QuestionBase {
  /** Stable identifier, also used as the persistence key for responses. */
  id: string;
  /** Research construct this question measures, for analysis/export. */
  construct: string;
  /** Human-facing section label the participant sees (never "Q4 of 10"). */
  section: string;
  /** Short label shown in review/summary contexts. */
  title: string;
  /** The question prompt shown to the participant. */
  question: string;
  required: boolean;
  /** Whether a voice-to-text answer path is offered alongside typing. */
  voiceEnabled?: boolean;
}

export interface SingleSelectQuestion extends QuestionBase {
  type: "single_select";
  options: QuestionOption[];
}

export interface MultiSelectQuestion extends QuestionBase {
  type: "multi_select";
  options: QuestionOption[];
}

export interface ScaleQuestion extends QuestionBase {
  type: "scale";
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
}

export interface ShortTextQuestion extends QuestionBase {
  type: "short_text";
}

export interface LongTextQuestion extends QuestionBase {
  type: "long_text";
}

export type InterviewQuestion =
  | SingleSelectQuestion
  | MultiSelectQuestion
  | ScaleQuestion
  | ShortTextQuestion
  | LongTextQuestion;

export type QuestionType = InterviewQuestion["type"];
