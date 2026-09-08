import type { Metadata } from "next";

import { ProfileContent } from "@/app/interview/profile/profile-content";
import { InterviewShell } from "@/components/layout/interview-shell";
import { ProgressIndicator } from "@/components/interview/progress-indicator";
import { getProgressPercent } from "@/features/interview/flow";

export const metadata: Metadata = { title: "About you" };

export default function ProfilePage() {
  return (
    <InterviewShell
      progress={<ProgressIndicator percent={getProgressPercent("profile")} />}
    >
      <ProfileContent />
    </InterviewShell>
  );
}
