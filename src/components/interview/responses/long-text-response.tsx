"use client";

import type { ResponseComponentProps } from "@/components/interview/responses/types";
import { Textarea } from "@/components/ui/textarea";

export function LongTextResponse({
  question,
  value,
  onChange,
  labelId,
  describedById,
}: ResponseComponentProps<"long_text">) {
  return (
    <Textarea
      aria-labelledby={labelId}
      aria-describedby={describedById}
      rows={5}
      placeholder="Type your answer…"
      value={value?.kind === "text" ? value.text : ""}
      maxLength={question.validation?.maxLength}
      onChange={(event) =>
        onChange({ kind: "text", text: event.target.value }, "typed")
      }
    />
  );
}
