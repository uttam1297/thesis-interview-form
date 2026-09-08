"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { StatusMessage } from "@/components/feedback/status-message";
import { ScreenHeading } from "@/components/interview/screen-heading";
import { InterviewShell } from "@/components/layout/interview-shell";
import { Button } from "@/components/ui/button";
import { resumeTokenStore } from "@/features/interview/persistence/resume-token-store";
import {
  ApiError,
  sessionApi,
} from "@/features/interview/persistence/server-api";
import {
  sessionErrorMessages,
  type SessionErrorCode,
} from "@/features/sessions/errors";

type State = { kind: "checking" } | { kind: "error"; code: SessionErrorCode };

/** Maps transport-level failures onto a message the participant can act on. */
function toSessionErrorCode(error: unknown): SessionErrorCode {
  if (!(error instanceof ApiError)) return "invalid_token";
  if (error.code === "network") return "unavailable";
  if (error.code === "invalid_body") return "invalid_token";
  return error.code;
}

export function ResumeHandoff({ token }: { token: string | null }) {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: "checking" });

  useEffect(() => {
    let cancelled = false;

    if (!token) {
      // Reported asynchronously so this effect never sets state inline.
      void Promise.resolve().then(() => {
        if (!cancelled) setState({ kind: "error", code: "invalid_token" });
      });
      return () => {
        cancelled = true;
      };
    }

    sessionApi
      .get(token)
      .then((snapshot) => {
        if (cancelled) return;
        if (snapshot.status === "completed") {
          setState({ kind: "error", code: "already_completed" });
          return;
        }
        resumeTokenStore.write(token);
        // Following the link is the participant's confirmation, so the
        // interview continues without asking again.
        resumeTokenStore.markAutoResume();
        // Drop the token from the URL before handing over to the interview.
        router.replace("/interview");
      })
      .catch((error) => {
        if (cancelled) return;
        setState({ kind: "error", code: toSessionErrorCode(error) });
      });

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (state.kind === "checking") {
    return (
      <InterviewShell>
        <p className="text-sm text-muted-foreground">Checking your link…</p>
      </InterviewShell>
    );
  }

  return (
    <InterviewShell>
      <div className="flex w-full max-w-(--width-content-narrow) flex-col items-center gap-6 text-center">
        <ScreenHeading>We could not continue that session</ScreenHeading>
        <StatusMessage variant="warning">
          {sessionErrorMessages[state.code]}
        </StatusMessage>
        <Button variant="outline" onClick={() => router.push("/interview")}>
          Go to the interview
        </Button>
      </div>
    </InterviewShell>
  );
}
