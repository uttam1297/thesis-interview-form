import type { Metadata } from "next";

import { SectionTransitionContent } from "@/app/interview/section-transition/section-transition-content";
import { InterviewShell } from "@/components/layout/interview-shell";
import { getStep } from "@/features/interview/flow";

export const metadata: Metadata = { title: "Section complete" };

export default function SectionTransitionPage() {
  const completedSection = getStep("profile").section ?? "";
  const nextSection = getStep("question").section ?? "";

  return (
    <InterviewShell>
      <SectionTransitionContent
        completedSection={completedSection}
        nextSection={nextSection}
      />
    </InterviewShell>
  );
}
