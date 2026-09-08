"use client";

import { CheckCircle2 } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { sectionVariants, transitions } from "@/lib/motion";

interface SectionTransitionContentProps {
  completedSection: string;
  nextSection: string;
}

export function SectionTransitionContent({
  completedSection,
  nextSection,
}: SectionTransitionContentProps) {
  return (
    <motion.div
      variants={sectionVariants}
      initial="enter"
      animate="center"
      transition={transitions.base}
      className="flex w-full max-w-(--width-content-narrow) flex-col items-center gap-8 text-center"
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="size-4 text-primary" />
        <span>Completed: {completedSection}</span>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-muted-foreground">Next</p>
        <h1 className="text-xl font-medium sm:text-2xl">{nextSection}</h1>
      </div>

      <p className="text-sm text-muted-foreground">About 3 minutes remaining</p>

      <Button nativeButton={false} render={<Link href="/interview/question" />}>
        Continue
      </Button>
    </motion.div>
  );
}
