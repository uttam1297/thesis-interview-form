"use client";

import { Radio as RadioPrimitive } from "@base-ui/react/radio";

import { RadioGroup } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface ScaleInputProps {
  name: string;
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  value?: number;
  onValueChange?: (value: number) => void;
  "aria-labelledby"?: string;
}

/** Likert-style scale renderer: one point selectable along a numeric range. */
export function ScaleInput({
  name,
  min,
  max,
  minLabel,
  maxLabel,
  value,
  onValueChange,
  ...aria
}: ScaleInputProps) {
  const points = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  return (
    <div className="w-full">
      <RadioGroup
        name={name}
        value={value !== undefined ? String(value) : null}
        onValueChange={(next: string) => onValueChange?.(Number(next))}
        className="flex flex-row items-center justify-between gap-2"
        {...aria}
      >
        {points.map((point) => (
          <RadioPrimitive.Root
            key={point}
            value={String(point)}
            className={cn(
              "flex size-10 cursor-pointer items-center justify-center rounded-full border text-sm font-medium transition-colors outline-none",
              "border-input bg-background text-foreground hover:bg-muted",
              "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              "data-checked:border-primary data-checked:bg-primary data-checked:text-primary-foreground"
            )}
          >
            {point}
          </RadioPrimitive.Root>
        ))}
      </RadioGroup>
      {(minLabel || maxLabel) && (
        <div className="mt-2 flex w-full justify-between text-xs text-muted-foreground">
          <span>{minLabel}</span>
          <span>{maxLabel}</span>
        </div>
      )}
    </div>
  );
}
