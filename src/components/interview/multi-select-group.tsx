"use client";

import { CheckboxGroup } from "@base-ui/react/checkbox-group";

import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel, FieldTitle } from "@/components/ui/field";
import type { QuestionOption } from "@/types/interview";

interface MultiSelectGroupProps {
  name: string;
  options: QuestionOption[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  "aria-labelledby"?: string;
}

/** Multi-choice question renderer: any number of options selectable. */
export function MultiSelectGroup({
  name,
  options,
  value,
  onValueChange,
  ...aria
}: MultiSelectGroupProps) {
  return (
    <CheckboxGroup
      value={value}
      onValueChange={(next: string[]) => onValueChange?.(next)}
      className="flex flex-col gap-2"
      {...aria}
    >
      {options.map((option) => {
        const id = `${name}-${option.value}`;
        return (
          <FieldLabel key={option.value} htmlFor={id}>
            <Field orientation="horizontal">
              <Checkbox name={option.value} id={id} />
              <FieldTitle>{option.label}</FieldTitle>
            </Field>
          </FieldLabel>
        );
      })}
    </CheckboxGroup>
  );
}
