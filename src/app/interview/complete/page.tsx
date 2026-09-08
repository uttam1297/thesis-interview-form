import type { Metadata } from "next";

import { CompleteContent } from "@/app/interview/complete/complete-content";
import { InterviewShell } from "@/components/layout/interview-shell";

export const metadata: Metadata = { title: "Thank you" };

export default function CompletePage() {
  return (
    <InterviewShell>
      <CompleteContent />
    </InterviewShell>
  );
}
