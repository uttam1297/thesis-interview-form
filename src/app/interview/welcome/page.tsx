import type { Metadata } from "next";

import { WelcomeContent } from "@/app/interview/welcome/welcome-content";
import { InterviewShell } from "@/components/layout/interview-shell";

export const metadata: Metadata = { title: "Welcome" };

export default function WelcomePage() {
  return (
    <InterviewShell>
      <WelcomeContent />
    </InterviewShell>
  );
}
