import type { Metadata } from "next";

import { ConsentContent } from "@/app/interview/consent/consent-content";
import { InterviewShell } from "@/components/layout/interview-shell";

export const metadata: Metadata = { title: "Consent" };

export default function ConsentPage() {
  return (
    <InterviewShell>
      <ConsentContent />
    </InterviewShell>
  );
}
