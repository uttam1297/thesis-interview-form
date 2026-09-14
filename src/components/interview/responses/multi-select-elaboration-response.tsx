"use client";

import { useId } from "react";

import { MultiSelectGroup } from "@/components/interview/multi-select-group";
import { DictatableField } from "@/components/interview/responses/dictatable-field";
import { OtherOptionInput } from "@/components/interview/responses/other-option-input";
import type { ResponseComponentProps } from "@/components/interview/responses/types";
import { OTHER_VALUE } from "@/features/interview/validate-response";

export function MultiSelectElaborationResponse({
  question,
  value,
  onChange,
  labelId,
  speechConsented = false,
}: ResponseComponentProps<"multi_select_with_elaboration">) {
  const elaborationLabelId = useId();
  const current =
    value?.kind === "multi_elaboration"
      ? value
      : { kind: "multi_elaboration" as const, values: [] };
  const options = question.allowOther
    ? [...question.options, { value: OTHER_VALUE, label: "Other" }]
    : question.options;
  const hasOther = current.values.includes(OTHER_VALUE);

  return (
    <div className="flex flex-col gap-5">
      <MultiSelectGroup
        name={question.id}
        options={options}
        value={current.values}
        onValueChange={(values) =>
          onChange(
            {
              ...current,
              values,
              other: values.includes(OTHER_VALUE) ? current.other : undefined,
            },
            "selected"
          )
        }
        aria-labelledby={labelId}
      />

      {hasOther && (
        <OtherOptionInput
          value={current.other ?? ""}
          onChange={(other) => onChange({ ...current, other }, "typed")}
        />
      )}

      <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-4">
        <p id={elaborationLabelId} className="text-sm font-medium">
          {question.elaborationPrompt}
        </p>
        <p className="text-xs text-muted-foreground">
          {question.elaborationRequired ? "Required" : "Optional"}
        </p>
        <DictatableField
          value={current.optionalElaboration ?? ""}
          onChange={(optionalElaboration, method) =>
            onChange({ ...current, optionalElaboration }, method)
          }
          labelId={elaborationLabelId}
          speechConsented={speechConsented}
          rows={3}
          placeholder={
            question.elaborationRequired
              ? "Explain which mattered most and why…"
              : "Add an optional explanation…"
          }
          required={question.elaborationRequired}
        />
      </div>
    </div>
  );
}
