import type { Metadata } from "next";

import { NewLiveSession } from "@/app/admin/(protected)/live/new/new-live-session";
import { consentContent } from "@/features/consent/content";

export const metadata: Metadata = { title: "New live interview" };

export default function NewLiveSessionPage() {
  return <NewLiveSession consentVersion={consentContent.version} />;
}
