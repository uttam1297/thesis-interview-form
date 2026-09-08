"use client";

import { CheckboxGroup } from "@base-ui/react/checkbox-group";
import { Check } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import { TWO_COLUMN_THRESHOLD } from "@/components/interview/single-select-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel, FieldTitle } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import type { QuestionOption } from "@/types/interview";

interface MultiSelectGroupProps {
  name: string;
  options: QuestionOption[];
  value?: string[];
  onValueChange?: (value: string[]) => void;
  "aria-labelledby"?: string;
}

/**
 * Multi-choice question renderer: any number of options selectable. Each
 * chosen row gets the same tick as a single-choice answer, so selection
 * feedback reads identically across question types.
 */
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
      className={cn(
        "grid gap-2",
        options.length > TWO_COLUMN_THRESHOLD && "sm:grid-cols-2"
      )}
      {...aria}
    >
      {options.map((option) => {
        const id = `${name}-${option.value}`;
        const isSelected = value?.includes(option.value) ?? false;
        return (
          <FieldLabel key={option.value} htmlFor={id}>
            <Field orientation="horizontal">
              <Checkbox name={option.value} id={id} />
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
    </CheckboxGroup>
  );
}
