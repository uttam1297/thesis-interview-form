"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Abstract illustration of the study's subject: scattered, uneven data on
 * the left resolving through a few paths into a single decision on the
 * right. It carries meaning rather than decoration — no gradients, no
 * floating shapes, one accent colour taken from the university's mark.
 *
 * Under reduced motion it renders its finished state with no animation.
 */

// Fixed, hand-placed points: a deterministic layout reads as considered,
// where randomness would look like noise.
const dataPoints = [
  { cx: 24, cy: 40, r: 4, o: 0.85 },
  { cx: 58, cy: 26, r: 2.5, o: 0.4 },
  { cx: 92, cy: 58, r: 3, o: 0.6 },
  { cx: 34, cy: 82, r: 3, o: 0.7 },
  { cx: 70, cy: 96, r: 4.5, o: 0.9 },
  { cx: 112, cy: 34, r: 2.5, o: 0.45 },
  { cx: 20, cy: 126, r: 3.5, o: 0.75 },
  { cx: 56, cy: 148, r: 2.5, o: 0.5 },
  { cx: 100, cy: 118, r: 4, o: 0.8 },
  { cx: 132, cy: 88, r: 3, o: 0.55 },
  { cx: 30, cy: 176, r: 4, o: 0.8 },
  { cx: 76, cy: 196, r: 2.5, o: 0.45 },
  { cx: 118, cy: 168, r: 3.5, o: 0.65 },
  { cx: 46, cy: 222, r: 3, o: 0.6 },
  { cx: 96, cy: 238, r: 2.5, o: 0.4 },
  { cx: 146, cy: 208, r: 3, o: 0.5 },
  { cx: 150, cy: 140, r: 2.5, o: 0.45 },
  { cx: 138, cy: 52, r: 2, o: 0.35 },
];

// Each path gathers part of the field toward the same endpoint.
const flowPaths = [
  "M 28 42 C 120 56, 200 98, 264 130",
  "M 24 128 C 110 130, 196 132, 264 133",
  "M 34 178 C 126 184, 202 158, 264 137",
  "M 74 98 C 152 104, 212 120, 264 132",
  "M 120 36 C 180 62, 226 104, 265 128",
  "M 100 240 C 168 226, 224 176, 265 141",
];

export function DecisionFlowGraphic({ className }: { className?: string }) {
  const prefersReducedMotion = useReducedMotion();

  // With reduced motion every element starts in its final state.
  const draw = prefersReducedMotion
    ? { pathLength: 1, opacity: 0.55 }
    : { pathLength: [0, 1], opacity: [0, 0.55] };

  return (
    <svg
      viewBox="0 0 340 270"
      role="img"
      aria-label="Scattered data points converging into a single decision"
      className={className}
    >
      {/* A faint measured ground, like the grid of a chart. */}
      {[70, 122, 174, 226].map((y) => (
        <line
          key={y}
          x1="18"
          y1={y}
          x2="180"
          y2={y}
          stroke="currentColor"
          strokeOpacity="0.06"
          strokeWidth="1"
        />
      ))}

      {/* Baseline: a quiet reference, like an axis. */}
      <line
        x1="18"
        y1="252"
        x2="322"
        y2="252"
        stroke="currentColor"
        strokeOpacity="0.12"
        strokeWidth="1"
      />

      {flowPaths.map((d, index) => (
        <motion.path
          key={d}
          d={d}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          initial={
            prefersReducedMotion ? undefined : { pathLength: 0, opacity: 0 }
          }
          animate={draw}
          transition={{
            duration: prefersReducedMotion ? 0 : 1.1,
            delay: prefersReducedMotion ? 0 : 0.25 + index * 0.12,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      ))}

      {dataPoints.map((point, index) => (
        <motion.circle
          key={`${point.cx}-${point.cy}`}
          cx={point.cx}
          cy={point.cy}
          r={point.r}
          fill="currentColor"
          initial={
            prefersReducedMotion ? undefined : { opacity: 0, scale: 0.6 }
          }
          animate={{ opacity: point.o, scale: 1 }}
          style={{ transformOrigin: `${point.cx}px ${point.cy}px` }}
          transition={{
            duration: prefersReducedMotion ? 0 : 0.4,
            delay: prefersReducedMotion ? 0 : index * 0.05,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      ))}

      {/* The decision: one clear, deliberate point. */}
      <motion.circle
        cx="278"
        cy="134"
        r="22"
        fill="none"
        stroke="var(--color-htw)"
        strokeWidth="1.25"
        strokeOpacity="0.35"
        initial={prefersReducedMotion ? undefined : { scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ transformOrigin: "278px 134px" }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.6,
          delay: prefersReducedMotion ? 0 : 1.15,
          ease: [0.16, 1, 0.3, 1],
        }}
      />
      <motion.circle
        cx="278"
        cy="134"
        r="8"
        fill="var(--color-htw)"
        initial={prefersReducedMotion ? undefined : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ transformOrigin: "278px 134px" }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.5,
          delay: prefersReducedMotion ? 0 : 1.05,
          ease: [0.16, 1, 0.3, 1],
        }}
      />
    </svg>
  );
}
