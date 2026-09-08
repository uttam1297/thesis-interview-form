"use client";

import { OtherOptionInput } from "@/components/interview/responses/other-option-input";
import type { ResponseComponentProps } from "@/components/interview/responses/types";
import { SingleSelectGroup } from "@/components/interview/single-select-group";
import { OTHER_VALUE } from "@/features/interview/validate-response";

export function SingleSelectResponse({
  question,
  value,
  onChange,
  labelId,
}: ResponseComponentProps<"single_select">) {
  const current = value?.kind === "single" ? value : null;
  const options = question.allowOther
    ? [...question.options, { value: OTHER_VALUE, label: "Other" }]
    : question.options;

  return (
    <div className="flex flex-col gap-4">
      <SingleSelectGroup
        name={question.id}
        options={options}
        value={current?.value}
        onValueChange={(next) =>
          onChange(
            {
              kind: "single",
              value: next,
              other: next === OTHER_VALUE ? current?.other : undefined,
            },
            "selected"
          )
        }
        aria-labelledby={labelId}
      />
      {current?.value === OTHER_VALUE && (
        <OtherOptionInput
          value={current.other ?? ""}
          onChange={(other) =>
            onChange({ kind: "single", value: OTHER_VALUE, other }, "typed")
          }
        />
      )}
    </div>
  );
}
