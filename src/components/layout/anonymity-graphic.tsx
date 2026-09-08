"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Line art for the consent screen: distinct people on one side of a
 * boundary, uniform anonymous records on the other. It says the thing the
 * consent text says — what you tell me is stored under a code, not your
 * name — in the same thin-line language as the landing page, without
 * repeating that drawing.
 *
 * Static under reduced motion.
 */

// Varied on the left: real people, no two alike.
const people = [
  { cx: 34, cy: 40, r: 5 },
  { cx: 26, cy: 92, r: 3.5 },
  { cx: 44, cy: 136, r: 6 },
  { cx: 28, cy: 184, r: 4 },
  { cx: 50, cy: 218, r: 3 },
];

// Uniform on the right: identical records, one highlighted as "yours".
const records = [40, 82, 124, 166, 208];

const BOUNDARY_X = 150;

export function AnonymityGraphic({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <svg
      viewBox="0 0 300 250"
      role="img"
      aria-label="People on one side of a boundary, anonymous records on the other"
      className={className}
      fill="none"
    >
      {people.map((person, index) => (
        <motion.path
          key={`line-${person.cy}`}
          d={`M ${person.cx + person.r + 4} ${person.cy} C 90 ${person.cy}, 110 ${records[index]}, ${BOUNDARY_X - 6} ${records[index]}`}
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
          initial={reduced ? false : { pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 0.35 }}
          transition={{
            duration: reduced ? 0 : 0.8,
            delay: reduced ? 0 : 0.2 + index * 0.08,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      ))}

      {people.map((person, index) => (
        <motion.circle
          key={`person-${person.cy}`}
          cx={person.cx}
          cy={person.cy}
          r={person.r}
          fill="currentColor"
          initial={reduced ? false : { opacity: 0, scale: 0.5 }}
          animate={{ opacity: 0.7, scale: 1 }}
          style={{ transformOrigin: `${person.cx}px ${person.cy}px` }}
          transition={{
            duration: reduced ? 0 : 0.4,
            delay: reduced ? 0 : index * 0.06,
            ease: [0.16, 1, 0.3, 1],
          }}
        />
      ))}

      {/* The boundary: nothing identifying crosses it. */}
      <motion.line
        x1={BOUNDARY_X}
        y1="18"
        x2={BOUNDARY_X}
        y2="232"
        stroke="currentColor"
        strokeWidth="1"
        strokeDasharray="4 6"
        initial={reduced ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.3 }}
        transition={{
          duration: reduced ? 0 : 0.6,
          delay: reduced ? 0 : 0.1,
          ease: [0.16, 1, 0.3, 1],
        }}
      />

      {/* Uniform records, indistinguishable from one another. */}
      {records.map((y, index) => {
        const isYours = index === 2;
        return (
          <motion.g
            key={`record-${y}`}
            initial={reduced ? false : { opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              duration: reduced ? 0 : 0.4,
              delay: reduced ? 0 : 0.75 + index * 0.07,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            <rect
              x={BOUNDARY_X + 32}
              y={y - 9}
              width="104"
              height="18"
              rx="9"
              stroke={isYours ? "var(--color-htw)" : "currentColor"}
              strokeOpacity={isYours ? 0.5 : 0.2}
              strokeWidth="1"
            />
            <circle
              cx={BOUNDARY_X + 45}
              cy={y}
              r="3"
              fill={isYours ? "var(--color-htw)" : "currentColor"}
              fillOpacity={isYours ? 1 : 0.3}
            />
            {/* A code standing in for a name. */}
            <line
              x1={BOUNDARY_X + 56}
              y1={y}
              x2={BOUNDARY_X + 118}
              y2={y}
              stroke="currentColor"
              strokeOpacity="0.2"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </motion.g>
        );
      })}
    </svg>
  );
}
