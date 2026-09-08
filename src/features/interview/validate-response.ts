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
  }
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
