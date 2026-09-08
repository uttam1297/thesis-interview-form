import type { Metadata } from "next";

import { QuestionChoiceContent } from "@/app/interview/question-choice/question-choice-content";
import { InterviewShell } from "@/components/layout/interview-shell";
import { ProgressIndicator } from "@/components/interview/progress-indicator";
import { getProgressPercent } from "@/features/interview/flow";

export const metadata: Metadata = { title: "How decisions happen" };

export default function QuestionChoicePage() {
  return (
    <InterviewShell
      progress={
        <ProgressIndicator percent={getProgressPercent("question-choice")} />
      }
    >
      <QuestionChoiceContent />
    </InterviewShell>
  );
}
