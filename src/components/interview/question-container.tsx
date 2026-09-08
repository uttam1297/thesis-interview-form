"use client";

import { motion } from "motion/react";
import type { ReactNode } from "react";

import { SectionHeader } from "@/components/interview/section-header";
import { questionVariants, transitions } from "@/lib/motion";

interface QuestionContainerProps {
  section: string;
  question: string;
  supportingText?: string;
  children: ReactNode;
}

/**
 * Layout shell for a single question: section label, prompt, and the
 * response control. Purely presentational — it renders whatever response
 * component the caller passes as `children`, and never knows about
 * question types itself.
 */
export function QuestionContainer({
  section,
  question,
  supportingText,
  children,
}: QuestionContainerProps) {
  return (
    <motion.div
      variants={questionVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={transitions.base}
      className="flex w-full max-w-(--width-content-narrow) flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <SectionHeader section={section} />
        <h1 className="text-xl font-medium text-balance sm:text-2xl">
          {question}
        </h1>
        {supportingText && (
          <p className="text-sm text-muted-foreground">{supportingText}</p>
        )}
      </div>
      {children}
    </motion.div>
  );
}
