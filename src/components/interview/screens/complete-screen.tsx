"use client";

import { motion, useReducedMotion } from "motion/react";

import { DecisionFlowGraphic } from "@/components/layout/decision-flow-graphic";
import { ScreenHeading } from "@/components/interview/screen-heading";
import { study } from "@/config/study";
import { useInterview } from "@/features/interview/use-interview";
import { transitions } from "@/lib/motion";

/** Content settles in after the mark, so the eye lands on the confirmation first. */
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.09, delayChildren: 0.45 } },
};

const item = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
};

/**
 * Confirmation that the interview is submitted. The mark draws itself once:
 * this is the one moment in the interview that earns a flourish, because it
 * tells the participant their work is safely done.
 */
export function CompleteScreen() {
  const { state } = useInterview();
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="flex w-full max-w-(--width-content-narrow) flex-col items-center gap-6 text-center">
      <ConfirmationMark reduced={Boolean(prefersReducedMotion)} />

      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center gap-6"
      >
        <motion.div
          variants={item}
          transition={transitions.base}
          className="flex flex-col gap-2"
        >
          <ScreenHeading>Thank you.</ScreenHeading>
          <p className="text-muted-foreground">
            Your responses have been submitted.
          </p>
        </motion.div>

        {state.participantRef && (
          <motion.div
            variants={item}
            transition={transitions.base}
            className="rounded-xl border bg-card px-5 py-4"
          >
            <p className="text-sm text-muted-foreground">
              Your participant reference
            </p>
            <p className="font-heading text-2xl font-medium tabular-nums">
              {state.participantRef}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep this if you may want your responses withdrawn later.
            </p>
          </motion.div>
        )}

        {/* Closes the loop with the landing page: the same scattered
            evidence, now resolved. */}
        <motion.div
          variants={item}
          transition={transitions.emphasized}
          className="w-full border-t pt-6"
        >
          <DecisionFlowGraphic className="mx-auto h-32 w-full max-w-sm text-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">
            Your answers become part of how this framework gets built.
          </p>
        </motion.div>

        <motion.p
          variants={item}
          transition={transitions.base}
          className="text-sm text-muted-foreground"
        >
          Questions about this research? Contact me at{" "}
          <a
            href={`mailto:${study.contactEmail}`}
            className="underline underline-offset-4 hover:text-foreground"
          >
            {study.contactEmail}
          </a>
          .
        </motion.p>
      </motion.div>
    </div>
  );
}

/**
 * A circle and tick that draw themselves in sequence. Under reduced motion
 * both are simply present, with no drawing.
 */
function ConfirmationMark({ reduced }: { reduced: boolean }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className="size-16 text-[var(--color-htw)]"
      aria-hidden="true"
      fill="none"
    >
      <motion.circle
        cx="32"
        cy="32"
        r="28"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        initial={reduced ? undefined : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: reduced ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
        // Begin the stroke at the top rather than the right-hand edge.
        style={{ rotate: -90, transformOrigin: "32px 32px" }}
      />
      <motion.path
        d="M20 33.5 L28.5 42 L44 25"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={reduced ? undefined : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{
          duration: reduced ? 0 : 0.35,
          delay: reduced ? 0 : 0.4,
          ease: [0.16, 1, 0.3, 1],
        }}
      />
    </svg>
  );
}
