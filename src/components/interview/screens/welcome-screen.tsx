"use client";

import { motion } from "motion/react";

import { ScreenHeading } from "@/components/interview/screen-heading";
import { Button } from "@/components/ui/button";
import { useInterview } from "@/features/interview/use-interview";
import { sectionVariants, transitions } from "@/lib/motion";

const highlights = [
  "About 25–30 minutes, pause any time",
  "Responses are anonymized",
  "Answer by typing or speaking",
];

export function WelcomeScreen() {
  const { dispatch, pendingDraft, hydrated, resumeDraft, discardDraft } =
    useInterview();

  return (
    <motion.div
      variants={sectionVariants}
      initial="enter"
      animate="center"
      transition={transitions.base}
      className="flex w-full max-w-(--width-content-narrow) flex-col gap-8 text-center"
    >
      <div className="flex flex-col gap-3">
        <ScreenHeading className="text-2xl sm:text-3xl">
          Help us understand how product decisions are made with data and AI.
        </ScreenHeading>
        <p className="text-muted-foreground">
          A short research interview for product professionals.
        </p>
      </div>

      <ul className="flex flex-col gap-2 text-sm text-muted-foreground">
        {highlights.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>

      {pendingDraft ? (
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm">
            You have an unfinished session on this device.
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button size="lg" onClick={resumeDraft}>
              Continue previous session
            </Button>
            <Button size="lg" variant="ghost" onClick={discardDraft}>
              Start over
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <Button
            size="lg"
            disabled={!hydrated}
            onClick={() => dispatch({ type: "START" })}
          >
            Begin
          </Button>
        </div>
      )}
    </motion.div>
  );
}
