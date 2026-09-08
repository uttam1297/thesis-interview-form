"use client";

import { motion, useReducedMotion } from "motion/react";

interface AnswerConstellationProps {
  /** One point per question in the whole interview. */
  total: number;
  /** How many of them have an answer so far. */
  answered: number;
  /** Zero-based position of the question on screen. */
  currentIndex: number;
  className?: string;
}

/**
 * The interview drawn as a constellation: one point per question, joined in
 * order as each is answered. It spans the whole interview rather than
 * resetting at each section, so it accumulates from the first question to
 * the last and the participant can see the shape they have built.
 *
 * Unlike the landing and consent drawings, this one is not shipped with the
 * app — the participant draws it. That is what makes art worth the space on
 * a screen whose job is to be answered.
 *
 * Points sit on a phyllotaxis spiral (the golden angle), so any number of
 * questions arranges itself evenly without hand-placed coordinates.
 */

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const CENTRE = { x: 150, y: 125 };

function pointAt(index: number, total: number) {
  const spread = total <= 1 ? 0 : Math.sqrt(index / (total - 1));
  const radius = 14 + 96 * spread;
  const angle = index * GOLDEN_ANGLE;
  return {
    x: CENTRE.x + radius * Math.cos(angle),
    y: CENTRE.y + radius * Math.sin(angle),
  };
}

/**
 * A slow drift, unique per point so the field breathes rather than pulsing
 * in unison. Amplitude stays near a pixel: enough to feel alive, not enough
 * to pull the eye from the question.
 */
function driftFor(index: number) {
  const dx = 1.6 + ((index * 7) % 5) * 0.35;
  const dy = 1.4 + ((index * 11) % 4) * 0.4;
  return {
    animate: {
      x: [0, dx, 0, -dx, 0],
      y: [0, -dy, dy * 0.6, dy, 0],
    },
    transition: {
      duration: 11 + (index % 7) * 1.7,
      repeat: Infinity,
      ease: "easeInOut" as const,
      delay: (index % 5) * 0.4,
    },
  };
}

export function AnswerConstellation({
  total,
  answered,
  currentIndex,
  className,
}: AnswerConstellationProps) {
  const reduced = useReducedMotion();
  const count = Math.max(total, 1);
  const points = Array.from({ length: count }, (_, i) => pointAt(i, count));

  return (
    <svg
      viewBox="0 0 300 250"
      role="img"
      aria-label={`${answered} of ${total} questions answered so far`}
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
              opacity: joined ? 0.4 : 0,
            }}
            transition={{
              duration: reduced ? 0 : 0.55,
              delay: reduced ? 0 : joined ? 0.1 : 0,
              ease: [0.16, 1, 0.3, 1],
            }}
          />
        );
      })}

      {points.map((point, index) => {
        const isAnswered = index < answered;
        const isCurrent = index === currentIndex;
        const drift = driftFor(index);

        return (
          <motion.g
            key={`point-${index}`}
            animate={reduced ? undefined : drift.animate}
            transition={reduced ? undefined : drift.transition}
          >
            {/* The current question breathes, so the eye can find it. */}
            {isCurrent && (
              <motion.circle
                cx={point.x}
                cy={point.y}
                r="11"
                stroke="var(--color-htw)"
                strokeWidth="1"
                initial={reduced ? false : { scale: 0.5, opacity: 0 }}
                animate={
                  reduced
                    ? { scale: 1, opacity: 0.35 }
                    : { scale: [1, 1.18, 1], opacity: [0.4, 0.15, 0.4] }
                }
                style={{ transformOrigin: `${point.x}px ${point.y}px` }}
                transition={
                  reduced
                    ? { duration: 0 }
                    : {
                        duration: 2.8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }
                }
              />
            )}

            {/* A halo that fades out as an answer lands. */}
            {isAnswered && (
              <motion.circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="var(--color-htw)"
                initial={reduced ? false : { scale: 1, opacity: 0.5 }}
                animate={{ scale: reduced ? 1 : 2.6, opacity: 0 }}
                style={{ transformOrigin: `${point.x}px ${point.y}px` }}
                transition={{ duration: reduced ? 0 : 0.9, ease: "easeOut" }}
              />
            )}

            <motion.circle
              cx={point.x}
              cy={point.y}
              r={isAnswered || isCurrent ? 4 : 2.5}
              fill={isAnswered ? "var(--color-htw)" : "currentColor"}
              initial={false}
              animate={{
                opacity: isAnswered ? 1 : isCurrent ? 0.6 : 0.18,
                scale: isCurrent ? 1.15 : 1,
              }}
              style={{ transformOrigin: `${point.x}px ${point.y}px` }}
              transition={{
                type: reduced ? "tween" : "spring",
                duration: reduced ? 0 : undefined,
                stiffness: 460,
                damping: 22,
              }}
            />
          </motion.g>
        );
      })}
    </svg>
  );
}
