"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

export interface SectionPathItem {
  id: string;
  label: string;
}

interface SectionPathProps {
  sections: SectionPathItem[];
  /** Zero-based index of the section the participant is in. */
  currentIndex: number;
  /** 0–100, for assistive technology and the numeric readout. */
  percent: number;
  /** "full" is the section-transition centrepiece; "compact" sits above a question. */
  variant?: "full" | "compact";
}

/**
 * The interview drawn as a line: one node per section, filled behind the
 * participant and hollow ahead. It replaces a plain progress bar because
 * "which part am I in" is the question people actually ask, and it carries
 * the line-art language of the landing page into the flow.
 *
 * Laid out with CSS rather than a stretched SVG, so the nodes stay circular
 * at every width.
 */
export function SectionPath({
  sections,
  currentIndex,
  percent,
  variant = "compact",
}: SectionPathProps) {
  const prefersReducedMotion = useReducedMotion();
  const full = variant === "full";
  const count = Math.max(sections.length, 1);
  const travelled = count > 1 ? currentIndex / (count - 1) : 1;

  return (
    <div
      className="flex w-full flex-col gap-2"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progress: section ${currentIndex + 1} of ${count}, ${percent}% complete`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <p className="truncate text-sm text-muted-foreground">
          {full
            ? `Section ${currentIndex + 1} of ${count}`
            : sections[currentIndex]?.label}
        </p>
        <p className="shrink-0 text-sm text-muted-foreground tabular-nums">
          {percent}%
        </p>
      </div>

      <div className={cn("relative w-full", full ? "h-6" : "h-4")}>
        {/* The whole road. */}
        <div
          aria-hidden="true"
          className="absolute top-1/2 right-0 left-0 h-px -translate-y-1/2 bg-foreground/15"
        />

        {/* The part already walked. */}
        <motion.div
          aria-hidden="true"
          className="absolute top-1/2 left-0 h-px -translate-y-1/2 bg-[var(--color-htw)]"
          initial={false}
          animate={{ width: `${travelled * 100}%` }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.5,
            ease: [0.16, 1, 0.3, 1],
          }}
        />

        {sections.map((section, index) => {
          const done = index < currentIndex;
          const here = index === currentIndex;
          const left = count > 1 ? (index / (count - 1)) * 100 : 0;
          return (
            <div
              key={section.id}
              aria-hidden="true"
              className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${left}%` }}
            >
              {here && (
                <motion.span
                  className={cn(
                    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-1 ring-[var(--color-htw)]/40",
                    full ? "size-5" : "size-4"
                  )}
                  initial={
                    prefersReducedMotion ? false : { scale: 0.5, opacity: 0 }
                  }
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    duration: prefersReducedMotion ? 0 : 0.45,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                />
              )}
              <motion.span
                className={cn(
                  "block rounded-full",
                  full ? "size-2.5" : "size-2",
                  done || here
                    ? "bg-[var(--color-htw)]"
                    : "bg-background ring-1 ring-foreground/25"
                )}
                initial={false}
                animate={{ scale: here ? 1.15 : 1 }}
                transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
