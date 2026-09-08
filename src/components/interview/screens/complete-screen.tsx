"use client";

import { motion, useReducedMotion } from "motion/react";

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

        {/* A quiet foreground surface lets the full-screen drawing remain
            visible around the content without competing with the reference. */}
        <motion.section
          variants={item}
          transition={transitions.emphasized}
          className="w-full overflow-hidden rounded-2xl border bg-card/92 shadow-(--shadow-subtle) backdrop-blur-[2px]"
        >
          {state.participantRef && (
            <div className="px-5 py-5 sm:px-6">
              <p className="text-sm text-muted-foreground">
                Your participant reference
              </p>
              <p className="font-heading text-3xl font-medium tabular-nums">
                {state.participantRef}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Keep this. Emailing me this code is how you withdraw your
                responses later.
              </p>
            </div>
          )}

          <div
            className={`px-6 py-5 ${state.participantRef ? "border-t" : ""}`}
          >
            <div className="mx-auto max-w-sm space-y-1.5">
              <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
                From response to research
              </p>
              <p className="font-heading text-lg leading-snug font-medium text-balance">
                Your answers become part of how this framework gets built.
              </p>
            </div>
          </div>
        </motion.section>

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

const backdropTransition = {
  duration: 0.9,
  ease: [0.16, 1, 0.3, 1] as const,
};

const mobileBackdropMask = {
  maskImage:
    "radial-gradient(ellipse 12rem 23rem at 50% 45%, transparent 68%, black 100%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 12rem 23rem at 50% 45%, transparent 68%, black 100%)",
};

const desktopBackdropMask = {
  maskImage:
    "radial-gradient(ellipse 24rem 19rem at 50% 46%, transparent 68%, black 100%)",
  WebkitMaskImage:
    "radial-gradient(ellipse 24rem 19rem at 50% 46%, transparent 68%, black 100%)",
};

/**
 * Full-screen research threads turn the completion page's negative space into
 * part of the composition. Desktop paths travel across the page; mobile paths
 * fall vertically so the drawing remains visible around the narrow card.
 */
export function CompletionBackdrop() {
  const reduced = Boolean(useReducedMotion());
  const pathProps = (delay: number) => ({
    initial: reduced ? undefined : { pathLength: 0, opacity: 0 },
    animate: { pathLength: 1, opacity: 0.34 },
    transition: {
      ...backdropTransition,
      duration: reduced ? 0 : 1.35,
      delay,
    },
  });

  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden text-foreground"
      aria-hidden="true"
    >
      {/* Mobile: a tall composition remains legible around the foreground. */}
      <svg
        viewBox="0 0 390 844"
        preserveAspectRatio="none"
        className="h-full min-h-180 w-full sm:hidden"
        style={mobileBackdropMask}
        fill="none"
      >
        {[
          [18, 64, 3],
          [76, 22, 2],
          [142, 70, 2.5],
          [238, 28, 3],
          [322, 76, 2],
          [374, 40, 3.5],
          [28, 710, 2.5],
          [92, 790, 3],
          [168, 742, 2],
        ].map(([cx, cy, r], index) => (
          <motion.circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r={r}
            fill="currentColor"
            initial={reduced ? undefined : { opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.25 + (index % 3) * 0.12, scale: 1 }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
            transition={{
              duration: reduced ? 0 : 0.35,
              delay: reduced ? 0 : index * 0.05,
            }}
          />
        ))}
        {[
          "M 18 64 C 48 218, 318 242, 348 706",
          "M 76 22 C 102 198, 300 288, 348 706",
          "M 142 70 C 160 254, 294 356, 348 706",
          "M 238 28 C 230 230, 302 388, 348 706",
          "M 322 76 C 286 254, 330 438, 348 706",
          "M 374 40 C 330 246, 354 470, 348 706",
        ].map((d, index) => (
          <motion.path
            key={d}
            d={d}
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            {...pathProps(reduced ? 0 : 0.08 + index * 0.08)}
          />
        ))}
        <motion.circle
          cx="348"
          cy="706"
          r="13"
          stroke="var(--color-htw)"
          strokeWidth="1.25"
          initial={reduced ? undefined : { opacity: 0, scale: 0.7 }}
          animate={{ opacity: 0.45, scale: 1 }}
          style={{ transformOrigin: "348px 706px" }}
          transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : 1 }}
        />
        <motion.circle
          cx="348"
          cy="706"
          r="5"
          fill="var(--color-htw)"
          initial={reduced ? undefined : { opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ transformOrigin: "348px 706px" }}
          transition={{
            duration: reduced ? 0 : 0.4,
            delay: reduced ? 0 : 0.95,
          }}
        />
      </svg>

      {/* Desktop: long paths use the otherwise empty edges of the viewport. */}
      <svg
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
        className="hidden size-full sm:block"
        style={desktopBackdropMask}
        fill="none"
      >
        {[
          [18, 120, 4],
          [82, 226, 3],
          [24, 360, 3.5],
          [116, 510, 5],
          [38, 690, 3],
          [178, 806, 4],
          [368, 164, 2.5],
          [520, 752, 3],
        ].map(([cx, cy, r], index) => (
          <motion.circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r={r}
            fill="currentColor"
            initial={reduced ? undefined : { opacity: 0, scale: 0.5 }}
            animate={{ opacity: 0.28 + (index % 3) * 0.12, scale: 1 }}
            style={{ transformOrigin: `${cx}px ${cy}px` }}
            transition={{
              duration: reduced ? 0 : 0.35,
              delay: reduced ? 0 : index * 0.05,
            }}
          />
        ))}
        {[
          "M 18 120 C 350 116, 610 270, 820 438 C 1040 612, 1160 654, 1324 706",
          "M 82 226 C 386 218, 606 316, 820 438 C 1028 558, 1168 636, 1324 706",
          "M 24 360 C 332 342, 606 374, 820 438 C 1038 504, 1174 610, 1324 706",
          "M 116 510 C 392 496, 620 462, 820 438 C 1026 416, 1194 542, 1324 706",
          "M 38 690 C 356 666, 614 546, 820 438 C 1032 330, 1210 464, 1324 706",
          "M 178 806 C 446 762, 646 596, 820 438 C 1012 266, 1238 398, 1324 706",
        ].map((d, index) => (
          <motion.path
            key={d}
            d={d}
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            {...pathProps(reduced ? 0 : 0.08 + index * 0.08)}
          />
        ))}
        <motion.circle
          cx="1324"
          cy="706"
          r="20"
          stroke="var(--color-htw)"
          strokeWidth="1.5"
          initial={reduced ? undefined : { opacity: 0, scale: 0.7 }}
          animate={{ opacity: 0.45, scale: 1 }}
          style={{ transformOrigin: "1324px 706px" }}
          transition={{ duration: reduced ? 0 : 0.5, delay: reduced ? 0 : 1 }}
        />
        <motion.circle
          cx="1324"
          cy="706"
          r="7"
          fill="var(--color-htw)"
          initial={reduced ? undefined : { opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ transformOrigin: "1324px 706px" }}
          transition={{
            duration: reduced ? 0 : 0.4,
            delay: reduced ? 0 : 0.95,
          }}
        />
      </svg>
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
