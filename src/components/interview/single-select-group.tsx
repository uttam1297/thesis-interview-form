"use client";

import { Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

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

/**
 * Single-choice question renderer: one option selectable, card-style rows.
 *
 * The chosen row gets a tick that springs in — a single-choice answer moves
 * the participant on immediately, so this confirms what was registered.
 * Multi-select deliberately has no such mark: there the running set of
 * checkboxes is the feedback, and a second animation would be noise.
 */
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
      {options.map((option) => {
        const isSelected = value === option.value;
        return (
          <FieldLabel key={option.value} htmlFor={`${name}-${option.value}`}>
            <Field orientation="horizontal">
              <RadioGroupItem
                value={option.value}
                id={`${name}-${option.value}`}
              />
              <FieldTitle className="flex-1">{option.label}</FieldTitle>

              <AnimatePresence initial={false}>
                {isSelected && (
                  <motion.span
                    key="chosen"
                    aria-hidden="true"
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.6, opacity: 0 }}
                    transition={{
                      type: "spring",
                      stiffness: 520,
                      damping: 26,
                      mass: 0.6,
                    }}
                    className="flex size-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-htw)]"
                  >
                    <Check className="size-3 text-white" strokeWidth={3} />
                  </motion.span>
                )}
              </AnimatePresence>
            </Field>
          </FieldLabel>
        );
      })}
    </RadioGroup>
  );
}
