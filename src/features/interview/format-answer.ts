import { OTHER_VALUE } from "@/features/interview/validate-response";
import type { InterviewQuestion, ResponseRecord } from "@/types/interview";

function optionLabel(
  question: InterviewQuestion,
  value: string,
  other?: string
): string {
  if (value === OTHER_VALUE)
    return other?.trim() ? `Other: ${other.trim()}` : "Other";
  if ("options" in question) {
    return question.options.find((o) => o.value === value)?.label ?? value;
  }
  return value;
}

/** Human-readable summary of an answer for the review screen. */
export function formatAnswer(
  question: InterviewQuestion,
  record: ResponseRecord | undefined
): string {
  if (!record) return "Not answered";
  if (record.skipped) return "Skipped";
  const value = record.value;
  if (value === null) return "Not answered";

  switch (value.kind) {
    case "single":
      return optionLabel(question, value.value, value.other);
    case "multi":
      return value.values
        .map((v) => optionLabel(question, v, value.other))
        .join(", ");
    case "scale": {
      const max =
        question.responseType === "likert_scale" ? question.max : undefined;
      return max ? `${value.value} / ${max}` : String(value.value);
    }
    case "ranking":
      return value.order
        .map((v, i) => `${i + 1}. ${optionLabel(question, v)}`)
        .join(" · ");
    case "text":
      return value.text.trim() || "Not answered";
  }
}
