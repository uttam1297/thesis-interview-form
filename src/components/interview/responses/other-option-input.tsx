"use client";

import { useId } from "react";

import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

interface OtherOptionInputProps {
  value: string;
  onChange: (value: string) => void;
}

/** Free-text field revealed when a participant picks "Other". */
export function OtherOptionInput({ value, onChange }: OtherOptionInputProps) {
  const id = useId();
  return (
    <Field>
      <FieldLabel htmlFor={id}>Please specify</FieldLabel>
      <Input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="off"
      />
    </Field>
  );
}
