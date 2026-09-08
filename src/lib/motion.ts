import type { Transition, Variants } from "motion/react";

/**
 * Shared animation presets. Components import these instead of inlining
 * their own duration/easing values, so motion stays consistent and easy
 * to retune from one place. Values mirror the tokens in globals.css.
 */

export const transitions = {
  fast: { duration: 0.15, ease: [0.4, 0, 0.2, 1] } satisfies Transition,
  base: { duration: 0.25, ease: [0.4, 0, 0.2, 1] } satisfies Transition,
  emphasized: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } satisfies Transition,
};

/** Question-to-question transition: communicates forward progression. */
export const questionVariants: Variants = {
  enter: { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

/** Subtle entrance for section-level content (welcome, consent, complete). */
export const sectionVariants: Variants = {
  enter: { opacity: 0, y: 8 },
  center: { opacity: 1, y: 0 },
};

/** Confirmation feedback, e.g. a selected option or completed action. */
export const confirmVariants: Variants = {
  initial: { scale: 0.96, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
};
