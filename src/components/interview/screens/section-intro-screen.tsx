"use client";

import { motion, useReducedMotion } from "motion/react";

import { NavigationControls } from "@/components/interview/navigation-controls";
import { ScreenHeading } from "@/components/interview/screen-heading";
import { SectionPath } from "@/components/interview/section-path";
import type { Step } from "@/features/interview/steps";
import { useInterview } from "@/features/interview/use-interview";
import { transitions } from "@/lib/motion";

interface SectionIntroScreenProps {
  step: Extract<Step, { kind: "section-intro" }>;
}

/** The finished section is acknowledged first, then the next one arrives. */
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

/**
 * The moment between sections. This is the only screen with nothing to
 * answer, so it earns a beat of its own: the section just finished is
 * ticked off, the path advances a node, and the next section is named.
 */
export function SectionIntroScreen({ step }: SectionIntroScreenProps) {
  const { dispatch, steps } = useInterview();
  const { section, completedSection, sectionNumber, sectionCount } = step;
  const prefersReducedMotion = useReducedMotion();

  const sections = steps
    .filter((s) => s.kind === "section-intro")
    .map((s) => ({ id: s.section.id, label: s.section.label }));

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="flex w-full max-w-(--width-content-narrow) flex-col items-center gap-8 text-center"
    >
      {completedSection && (
        <motion.div
          variants={item}
          transition={transitions.base}
          className="flex items-center gap-2 text-sm text-muted-foreground"
        >
          <CompletedTick reduced={Boolean(prefersReducedMotion)} />
          <span>Completed: {completedSection.label}</span>
        </motion.div>
      )}

      <motion.div
        variants={item}
        transition={transitions.emphasized}
        className="flex flex-col gap-2"
      >
        <p className="text-sm tracking-wide text-muted-foreground uppercase">
          {completedSection ? "Next" : "First"}
        </p>
        <ScreenHeading>{section.label}</ScreenHeading>
        {section.intro && (
          <p className="text-muted-foreground">{section.intro}</p>
        )}
      </motion.div>

      {/*
        Position rather than a predicted duration: no pilot timings exist
        yet to ground a minutes estimate, and a wrong one erodes trust.
      */}
      <motion.div
        variants={item}
        transition={transitions.base}
        className="w-full"
      >
        <SectionPath
          variant="full"
          sections={sections}
          currentIndex={sectionNumber - 1}
          percent={Math.round(((sectionNumber - 1) / sectionCount) * 100)}
        />
      </motion.div>

      <motion.div
        variants={item}
        transition={transitions.base}
        className="w-full"
      >
        <NavigationControls
          onBack={
            completedSection ? () => dispatch({ type: "BACK" }) : undefined
          }
          onContinue={() => dispatch({ type: "NEXT" })}
        />
      </motion.div>
    </motion.div>
  );
}

/** A tick that draws itself, marking the section just finished. */
function CompletedTick({ reduced }: { reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="size-5 text-[var(--color-htw)]"
      fill="none"
    >
      <motion.circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="1.75"
        initial={reduced ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
        style={{ rotate: -90, transformOrigin: "12px 12px" }}
      />
      <motion.path
        d="M7.5 12.5 L10.5 15.5 L16.5 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          duration: reduced ? 0 : 0.3,
          delay: reduced ? 0 : 0.3,
          ease: [0.16, 1, 0.3, 1],
        }}
      />
    </svg>
  );
}
