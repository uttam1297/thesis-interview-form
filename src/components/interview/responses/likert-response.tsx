"use client";

import type { ResponseComponentProps } from "@/components/interview/responses/types";
import { ScaleInput } from "@/components/interview/scale-input";

export function LikertResponse({
  question,
  value,
  onChange,
  labelId,
}: ResponseComponentProps<"likert_scale">) {
  return (
    <ScaleInput
      name={question.id}
      min={question.min}
      max={question.max}
      minLabel={question.minLabel}
      maxLabel={question.maxLabel}
      value={value?.kind === "scale" ? value.value : undefined}
      onValueChange={(next) =>
        onChange({ kind: "scale", value: next }, "selected")
      }
      aria-labelledby={labelId}
    />
  );
}
