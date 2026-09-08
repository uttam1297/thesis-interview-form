"use client";

import { motion, useReducedMotion } from "motion/react";

interface AnswerConstellationProps {
  /** One point per question in the current section. */
  total: number;
  /** How many of them have an answer so far. */
  answered: number;
  /** Zero-based position of the question on screen. */
  currentIndex: number;
  className?: string;
}

/**
 * The section drawn as a constellation: one point per question, joined in
 * order as they are answered. Unlike the landing and consent drawings this
 * one is not fixed — it is built by the participant, and gains a point each
 * time they answer, which is the only honest way to make art on a question
 * screen worth the space it takes.
 *
 * Points sit on a phyllotaxis spiral (the golden angle), so any number of
 * questions produces an even, unclustered arrangement without hand-placing
 * coordinates.
 */

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const CENTRE = { x: 150, y: 125 };

function pointAt(index: number, total: number) {
  const spread = total <= 1 ? 0 : Math.sqrt(index / (total - 1));
  const radius = 16 + 88 * spread;
  const angle = index * GOLDEN_ANGLE;
  return {
    x: CENTRE.x + radius * Math.cos(angle),
    y: CENTRE.y + radius * Math.sin(angle),
  };
}

export function AnswerConstellation({
  total,
  answered,
  currentIndex,
  className,
}: AnswerConstellationProps) {
  const reduced = useReducedMotion();
  const points = Array.from({ length: Math.max(total, 1) }, (_, i) =>
    pointAt(i, Math.max(total, 1))
  );

  return (
    <svg
      viewBox="0 0 300 250"
      role="img"
      aria-label={`${answered} of ${total} questions answered in this section`}
      className={className}
      fill="none"
    >
      {/* Joins between answered points, drawn as each one lands. */}
      {points.slice(1).map((point, index) => {
        const from = points[index];
        const joined = index + 1 <= answered - 1;
        return (
          <motion.line
            key={`join-${index}`}
            x1={from.x}
            y1={from.y}
            x2={point.x}
            y2={point.y}
            stroke="var(--color-htw)"
            strokeWidth="1"
            strokeLinecap="round"
            initial={false}
            animate={{
              pathLength: joined ? 1 : 0,
              opacity: joined ? 0.45 : 0,
            }}
            transition={{
              duration: reduced ? 0 : 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        );
      })}

      {points.map((point, index) => {
        const isAnswered = index < answered;
        const isCurrent = index === currentIndex;
        return (
          <g key={`point-${index}`}>
            {isCurrent && (
              <motion.circle
                cx={point.x}
                cy={point.y}
                r="11"
                stroke="var(--color-htw)"
                strokeOpacity="0.35"
                strokeWidth="1"
                initial={reduced ? false : { scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ transformOrigin: `${point.x}px ${point.y}px` }}
                transition={{
                  duration: reduced ? 0 : 0.45,
                  ease: [0.16, 1, 0.3, 1],
                }}
              />
            )}
            <motion.circle
              cx={point.x}
              cy={point.y}
              r={isAnswered || isCurrent ? 4 : 2.5}
              fill={isAnswered ? "var(--color-htw)" : "currentColor"}
              initial={false}
              animate={{
                opacity: isAnswered ? 1 : isCurrent ? 0.6 : 0.2,
                scale: isCurrent ? 1.15 : 1,
              }}
              style={{ transformOrigin: `${point.x}px ${point.y}px` }}
              transition={{
                type: reduced ? "tween" : "spring",
                duration: reduced ? 0 : undefined,
                stiffness: 480,
                damping: 24,
              }}
            />
          </g>
        );
      })}
    </svg>
  );
}
