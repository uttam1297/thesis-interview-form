"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useInterview } from "@/features/interview/use-interview";

/**
 * Lets a participant carry their unfinished session to another device. The
 * link contains the resume token, so the copy affordance is deliberately
 * explicit rather than something shown by default on screen.
 */
export function ResumeLink() {
  const { resumeToken } = useInterview();
  const [copied, setCopied] = useState(false);

  if (!resumeToken) return null;

  const url =
    typeof window === "undefined"
      ? ""
      : `${window.location.origin}/interview/resume?token=${encodeURIComponent(resumeToken)}`;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span>Continuing on another device?</span>
      <Button
        variant="link"
        size="xs"
        className="h-auto p-0"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            window.prompt("Copy your resume link", url);
          }
        }}
      >
        {copied ? "Link copied" : "Copy resume link"}
      </Button>
    </div>
  );
}
