"use client";

import { MultiSelectGroup } from "@/components/interview/multi-select-group";
import { OtherOptionInput } from "@/components/interview/responses/other-option-input";
import type { ResponseComponentProps } from "@/components/interview/responses/types";
import { OTHER_VALUE } from "@/features/interview/validate-response";

export function MultiSelectResponse({
  question,
  value,
  onChange,
  labelId,
}: ResponseComponentProps<"multi_select">) {
  const current = value?.kind === "multi" ? value : null;
  const options = question.allowOther
    ? [...question.options, { value: OTHER_VALUE, label: "Other" }]
    : question.options;
  const hasOther = current?.values.includes(OTHER_VALUE) ?? false;

  return (
    <div className="flex flex-col gap-4">
      <MultiSelectGroup
        name={question.id}
        options={options}
        value={current?.values ?? []}
        onValueChange={(values) =>
          onChange(
            values.length === 0
              ? null
              : {
                  kind: "multi",
                  values,
                  other: values.includes(OTHER_VALUE)
                    ? current?.other
                    : undefined,
                },
            "selected"
          )
        }
        aria-labelledby={labelId}
      />
      {hasOther && current && (
        <OtherOptionInput
          value={current.other ?? ""}
          onChange={(other) => onChange({ ...current, other }, "typed")}
        />
      )}
    </div>
  );
}
