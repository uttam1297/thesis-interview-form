"use client";

import { CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

import { ScreenHeading } from "@/components/interview/screen-heading";
import { useInterview } from "@/features/interview/use-interview";
import { confirmVariants, transitions } from "@/lib/motion";

export function CompleteScreen() {
  const { state } = useInterview();

  return (
    <div className="flex w-full max-w-(--width-content-narrow) flex-col items-center gap-6 text-center">
      <motion.div
        variants={confirmVariants}
        initial="initial"
        animate="animate"
        transition={transitions.emphasized}
      >
        <CheckCircle2 className="size-12 text-primary" aria-hidden="true" />
      </motion.div>
      <div className="flex flex-col gap-2">
        <ScreenHeading>Thank you.</ScreenHeading>
        <p className="text-sm text-muted-foreground">
          Your responses have been submitted.
        </p>
      </div>
      {state.participantRef && (
        <p className="text-sm">
          Your participant reference:{" "}
          <span className="font-medium tabular-nums">
            {state.participantRef}
          </span>
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Questions about this research? Contact the study team at
        research@example.edu.
      </p>
    </div>
  );
}
