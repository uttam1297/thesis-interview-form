import type {
  Condition,
  InterviewQuestion,
  ResponseRecord,
} from "@/types/interview";

type ResponseMap = Record<string, ResponseRecord>;

function answeredValues(record: ResponseRecord | undefined): string[] | null {
  if (!record || record.skipped || record.value === null) return null;
  const value = record.value;
  switch (value.kind) {
    case "single":
      return [value.value];
    case "multi":
      return value.values;
    case "scale":
      return [String(value.value)];
    case "ranking":
      return value.order;
    case "text":
      return value.text.trim() ? [value.text] : null;
    default:
      return null;
  }
}

export function evaluateCondition(
  condition: Condition,
  responses: ResponseMap
): boolean {
  const values = answeredValues(responses[condition.questionId]);
  const isAnswered = values !== null;

  switch (condition.operator) {
    case "answered":
      return isAnswered;
    case "not_answered":
      return !isAnswered;
    case "equals":
      return isAnswered && values.length === 1 && values[0] === condition.value;
    case "not_equals":
      return (
        !isAnswered || values.length !== 1 || values[0] !== condition.value
      );
    case "includes":
      return (
        isAnswered &&
        condition.value !== undefined &&
        values.includes(condition.value)
      );
    case "not_includes":
      return (
        !isAnswered ||
        condition.value === undefined ||
        !values.includes(condition.value)
      );
  }
}

/** A question is visible when it has no conditions or every condition holds. */
export function isQuestionVisible(
  question: InterviewQuestion,
  responses: ResponseMap
): boolean {
  if (!question.showIf || question.showIf.length === 0) return true;
  return question.showIf.every((c) => evaluateCondition(c, responses));
}
