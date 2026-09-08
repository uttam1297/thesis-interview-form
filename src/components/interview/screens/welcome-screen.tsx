"use client";

import { Check } from "lucide-react";
import { motion } from "motion/react";

import { DecisionFlowGraphic } from "@/components/layout/decision-flow-graphic";
import { Button } from "@/components/ui/button";
import { study } from "@/config/study";
import { useInterview } from "@/features/interview/use-interview";
import { transitions } from "@/lib/motion";

const highlights = [
  "About 25–30 minutes, and you can pause any time",
  "Your responses are anonymized",
  "Answer by typing or speaking — whichever you prefer",
];

/** Children appear in sequence, so the eye is led down to the action. */
const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export function WelcomeScreen() {
  const { dispatch, pendingDraft, hydrated, resumeDraft, discardDraft } =
    useInterview();

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="visible"
      className="grid w-full items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-16"
    >
      <div className="flex flex-col items-center gap-7 text-center lg:items-start lg:text-left">
        {/* A plain img: the mark is a fixed-size asset that animates with
            the rest of the hero, which next/image would only complicate. */}
        <motion.img
          variants={item}
          transition={transitions.base}
          src={study.logo.src}
          alt={study.logo.alt}
          width={study.logo.width}
          height={study.logo.height}
          className="h-16 w-auto rounded-md bg-white p-1.5 sm:h-20 dark:ring-1 dark:ring-white/10"
        />

        <motion.div
          variants={item}
          transition={transitions.base}
          className="flex flex-col gap-3"
        >
          <p className="text-sm font-medium tracking-[0.12em] text-muted-foreground uppercase">
            {study.programme}
          </p>
          <h1 className="font-heading text-[1.75rem] leading-[1.18] font-medium text-balance sm:text-4xl">
            {study.title}
          </h1>
        </motion.div>

        <motion.p
          variants={item}
          transition={transitions.base}
          className="max-w-xl text-lg text-balance text-muted-foreground"
        >
          Help us understand how product decisions are really made with data and
          AI — from the people who make them.
        </motion.p>

        <motion.ul
          variants={item}
          transition={transitions.base}
          className="flex flex-col gap-2.5 text-left"
        >
          {highlights.map((highlight) => (
            <li key={highlight} className="flex items-start gap-2.5">
              <Check
                className="mt-1 size-4 shrink-0 text-[var(--color-htw)]"
                aria-hidden="true"
              />
              <span className="text-muted-foreground">{highlight}</span>
            </li>
          ))}
        </motion.ul>

        <motion.div variants={item} transition={transitions.base}>
          {pendingDraft ? (
            <div className="flex flex-col items-center gap-3 lg:items-start">
              <p>You have an unfinished session on this device.</p>
              <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                <Button size="lg" className="min-h-11" onClick={resumeDraft}>
                  Continue previous session
                </Button>
                <Button
                  size="lg"
                  variant="ghost"
                  className="min-h-11"
                  onClick={discardDraft}
                >
                  Start over
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="lg"
              className="min-h-11 px-6"
              disabled={!hydrated}
              onClick={() => dispatch({ type: "START" })}
            >
              Begin the interview
            </Button>
          )}
        </motion.div>
      </div>

      {/* On small screens the graphic follows the call to action, so it
          never pushes the button below the fold. */}
      <motion.div
        variants={item}
        transition={transitions.emphasized}
        className="order-last w-full lg:order-none lg:w-auto"
      >
        <div className="rounded-2xl border bg-card p-6 shadow-(--shadow-subtle) sm:p-8">
          <DecisionFlowGraphic className="h-44 w-full text-foreground sm:h-56 lg:h-64 lg:w-80" />
          <p className="mt-4 text-sm text-muted-foreground lg:max-w-72">
            Scattered evidence becomes one decision. This study asks how that
            actually happens in practice.
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}
