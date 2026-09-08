"use client";

import { Field, FieldLabel, FieldTitle } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { QuestionOption } from "@/types/interview";

interface SingleSelectGroupProps {
  name: string;
  options: QuestionOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  "aria-labelledby"?: string;
}

/** Single-choice question renderer: one option selectable, card-style rows. */
export function SingleSelectGroup({
  name,
  options,
  value,
  onValueChange,
  ...aria
}: SingleSelectGroupProps) {
  return (
    <RadioGroup
      name={name}
      value={value ?? null}
      onValueChange={(next: string) => onValueChange?.(next)}
      className="gap-2"
      {...aria}
    >
      {options.map((option) => (
        <FieldLabel key={option.value} htmlFor={`${name}-${option.value}`}>
          <Field orientation="horizontal">
            <RadioGroupItem
              value={option.value}
              id={`${name}-${option.value}`}
            />
            <FieldTitle>{option.label}</FieldTitle>
          </Field>
        </FieldLabel>
      ))}
    </RadioGroup>
  );
}
