"use client";

import type { ResponseComponentProps } from "@/components/interview/responses/types";
import { Input } from "@/components/ui/input";

export function ShortTextResponse({
  question,
  value,
  onChange,
  labelId,
  describedById,
}: ResponseComponentProps<"short_text">) {
  return (
    <Input
      aria-labelledby={labelId}
      aria-describedby={describedById}
      value={value?.kind === "text" ? value.text : ""}
      maxLength={question.validation?.maxLength}
      onChange={(event) =>
        onChange({ kind: "text", text: event.target.value }, "typed")
      }
    />
  );
}
