import type { Metadata } from "next";

import { QuestionContent } from "@/app/interview/question/question-content";
import { InterviewShell } from "@/components/layout/interview-shell";
import { ProgressIndicator } from "@/components/interview/progress-indicator";
import { getProgressPercent } from "@/features/interview/flow";

export const metadata: Metadata = { title: "Data and AI" };

export default function QuestionPage() {
  return (
    <InterviewShell
      progress={<ProgressIndicator percent={getProgressPercent("question")} />}
    >
      <QuestionContent />
    </InterviewShell>
  );
}
