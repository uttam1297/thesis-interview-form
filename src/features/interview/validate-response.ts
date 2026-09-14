import type {
  InterviewQuestion,
  ResponseRecord,
  ResponseValue,
} from "@/types/interview";

/**
 * Pure answer validation for a single question. Returns a participant-facing
 * message, or null when the response satisfies the question's rules.
 * "Skip" is handled by the engine, not here: this only judges a value.
 */
export function validateResponse(
  question: InterviewQuestion,
  value: ResponseValue | null
): string | null {
  if (value === null) {
    return question.required
      ? "This question needs an answer to continue."
      : null;
  }

  switch (question.responseType) {
    case "single_select": {
      if (value.kind !== "single" || !value.value) return "Choose one option.";
      if (value.value === OTHER_VALUE && !value.other?.trim()) {
        return "Please describe your answer for “Other”.";
      }
      return null;
    }
    case "multi_select": {
      if (value.kind !== "multi") return "Choose at least one option.";
      const min =
        question.validation?.minSelections ?? (question.required ? 1 : 0);
      const max = question.validation?.maxSelections;
      if (value.values.length < min) {
        return min === 1
          ? "Choose at least one option."
          : `Choose at least ${min} options.`;
      }
      if (max !== undefined && value.values.length > max) {
        return `Choose no more than ${max} options.`;
      }
      if (value.values.includes(OTHER_VALUE) && !value.other?.trim()) {
        return "Please describe your answer for “Other”.";
      }
      return null;
    }
    case "multi_select_with_elaboration": {
      if (value.kind !== "multi_elaboration")
        return "Choose at least one option.";
      const min = question.validation?.minSelections ?? 1;
      const max = question.validation?.maxSelections;
      if (value.values.length < min) return "Choose at least one option.";
      if (max !== undefined && value.values.length > max) {
        return `Choose no more than ${max} options.`;
      }
      if (value.values.includes(OTHER_VALUE) && !value.other?.trim()) {
        return "Please describe your answer for “Other”.";
      }
      const elaboration = value.optionalElaboration?.trim() ?? "";
      if (question.elaborationRequired && !elaboration) {
        return "Please explain which input mattered most and why.";
      }
      if (elaboration && !hasMeaningfulOpenText(elaboration)) {
        return "Please use words or numbers in your explanation.";
      }
      return null;
    }
    case "likert_scale": {
      if (value.kind !== "scale") return "Choose a point on the scale.";
      if (value.value < question.min || value.value > question.max) {
        return "Choose a point on the scale.";
      }
      return null;
    }
    case "ranking": {
      if (value.kind !== "ranking") return "Order the options.";
      const expected = question.options.map((o) => o.value).sort();
      const actual = [...value.order].sort();
      if (
        expected.length !== actual.length ||
        expected.some((v, i) => v !== actual[i])
      ) {
        return "Order all options.";
      }
      return null;
    }
    case "short_text":
    case "long_text":
    case "voice_or_text":
    case "optional_elaboration": {
      if (value.kind !== "text") return "Enter an answer.";
      const text = value.text.trim();
      if (question.required && text.length === 0)
        return "Enter an answer to continue.";
      if (
        question.id.startsWith("v2_") &&
        text.length > 0 &&
        !hasMeaningfulOpenText(text)
      ) {
        return "Please use words or numbers, or leave this optional answer blank.";
      }
      const { minLength, maxLength } = question.validation ?? {};
      if (
        minLength !== undefined &&
        text.length > 0 &&
        text.length < minLength
      ) {
        return `Please write at least ${minLength} characters.`;
      }
      if (maxLength !== undefined && text.length > maxLength) {
        return `Please keep this under ${maxLength} characters.`;
      }
      return null;
    }
    case "guided_open": {
      if (value.kind !== "guided_text") return "Enter or choose an answer.";
      const text = value.text.trim();
      const nonAnswer = value.nonAnswer;
      const allowedNonAnswers = new Set(
        question.nonAnswerOptions?.map((option) => option.value) ?? []
      );
      if (nonAnswer && !allowedNonAnswers.has(nonAnswer)) {
        return "Choose one of the available responses.";
      }
      if (!nonAnswer && !hasMeaningfulOpenText(text)) {
        return text
          ? "Please use words or numbers in your answer."
          : "Enter an answer or choose one of the alternatives.";
      }
      if (
        value.optionalElaboration?.trim() &&
        !hasMeaningfulOpenText(value.optionalElaboration)
      ) {
        return "Please use words or numbers in the optional answer.";
      }
      const { maxLength } = question.validation ?? {};
      if (maxLength !== undefined && text.length > maxLength) {
        return `Please keep this under ${maxLength} characters.`;
      }
      return null;
    }
  }
}

/** A response needs at least one Unicode letter or number, but no arbitrary length. */
export function hasMeaningfulOpenText(text: string): boolean {
  return /[\p{L}\p{N}]/u.test(text);
}

/** Sentinel option value used when `allowOther` is enabled. */
export const OTHER_VALUE = "__other__";

/** True when a record can count as "done" for progress and review. */
export function isRecordComplete(
  question: InterviewQuestion,
  record: ResponseRecord | undefined
): boolean {
  if (!record) return false;
  if (record.skipped) return true;
  return validateResponse(question, record.value) === null;
}
