import type { Metadata } from "next";

import { LiveInterviewRunner } from "@/app/admin/(protected)/live/[token]/live-interview-runner";

export const metadata: Metadata = { title: "Live interview entry" };

/**
 * Data entry for an in-progress live interview. The researcher works through
 * the same questionnaire the online form uses, so both collection modes
 * produce directly comparable records.
 */
export default async function LiveInterviewPage({
  params,
}: PageProps<"/admin/live/[token]">) {
  const { token } = await params;
  return <LiveInterviewRunner resumeToken={decodeURIComponent(token)} />;
}
