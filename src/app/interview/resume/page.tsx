import type { Metadata } from "next";

import { ResumeHandoff } from "@/app/interview/resume/resume-handoff";

export const metadata: Metadata = { title: "Continue your interview" };

/**
 * Landing page for a resume link. The token arrives in the query string,
 * is moved into this browser's storage, and the URL is replaced so it does
 * not linger in history or get shared by accident.
 */
export default async function ResumePage({
  searchParams,
}: PageProps<"/interview/resume">) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : null;
  return <ResumeHandoff token={token} />;
}
