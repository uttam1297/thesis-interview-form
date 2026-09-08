import type { Metadata } from "next";

import { ReviewContent } from "@/app/interview/review/review-content";
import { InterviewShell } from "@/components/layout/interview-shell";

export const metadata: Metadata = { title: "Review your answers" };

export default function ReviewPage() {
  return (
    <InterviewShell>
      <ReviewContent />
    </InterviewShell>
  );
}
