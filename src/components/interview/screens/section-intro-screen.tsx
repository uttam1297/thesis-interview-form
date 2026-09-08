"use client";

import { CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";

import { NavigationControls } from "@/components/interview/navigation-controls";
import { ScreenHeading } from "@/components/interview/screen-heading";
import type { Step } from "@/features/interview/steps";
import { useInterview } from "@/features/interview/use-interview";
import { sectionVariants, transitions } from "@/lib/motion";

interface SectionIntroScreenProps {
  step: Extract<Step, { kind: "section-intro" }>;
}

export function SectionIntroScreen({ step }: SectionIntroScreenProps) {
  const { dispatch } = useInterview();
  const { section, completedSection, remainingMinutes } = step;

  return (
    <motion.div
      variants={sectionVariants}
      initial="enter"
      animate="center"
      transition={transitions.base}
      className="flex w-full max-w-(--width-content-narrow) flex-col items-center gap-8 text-center"
    >
      {completedSection && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
          <span>Completed: {completedSection.label}</span>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">
          {completedSection ? "Next" : "First"}
        </p>
        <ScreenHeading>{section.label}</ScreenHeading>
        {section.intro && (
          <p className="text-sm text-muted-foreground">{section.intro}</p>
        )}
      </div>

      {remainingMinutes !== null && (
        <p className="text-sm text-muted-foreground">
          About {remainingMinutes} minutes remaining
        </p>
      )}

      <NavigationControls
        onBack={completedSection ? () => dispatch({ type: "BACK" }) : undefined}
        onContinue={() => dispatch({ type: "NEXT" })}
      />
    </motion.div>
  );
}
