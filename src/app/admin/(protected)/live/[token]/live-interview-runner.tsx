"use client";

import { useEffect, useMemo, useState } from "react";

import { StatusMessage } from "@/components/feedback/status-message";
import { InterviewRunner } from "@/components/interview/interview-runner";
import { InterviewProvider } from "@/features/interview/interview-provider";
import { LiveSessionPersistence } from "@/features/interview/persistence/live-session";
import {
  sessionApi,
  type SessionSnapshotDto,
} from "@/features/interview/persistence/server-api";
import type { InterviewPersistence } from "@/features/interview/persistence/types";
import { unsupportedSpeechAdapter } from "@/features/voice/adapter";
import { VoiceAdapterProvider } from "@/features/voice/voice-adapter-context";

/**
 * Runs the participant engine for researcher-entered data. Two differences
 * from the participant app: nothing is written to this browser's local
 * storage (the researcher may enter several interviews from one machine),
 * and dictation is off, so a typed answer is never mistaken for the
 * participant's own recorded voice.
 */
export function LiveInterviewRunner({ resumeToken }: { resumeToken: string }) {
  const [snapshot, setSnapshot] = useState<SessionSnapshotDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    sessionApi
      .get(resumeToken)
      .then((result) => {
        if (!cancelled) setSnapshot(result);
      })
      .catch(() => {
        if (!cancelled) setError("This live session could not be loaded.");
      });
    return () => {
      cancelled = true;
    };
  }, [resumeToken]);

  const persistence = useMemo<InterviewPersistence | null>(() => {
    if (!snapshot) return null;
    const live = new LiveSessionPersistence(resumeToken, snapshot);
    return { drafts: live, submissions: live, sync: live };
  }, [resumeToken, snapshot]);

  if (error) {
    return <StatusMessage variant="warning">{error}</StatusMessage>;
  }
  if (!snapshot || !persistence) {
    return <p className="text-sm text-muted-foreground">Loading session…</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-lg border bg-muted/40 px-4 py-3 text-sm">
        Live interview · participant{" "}
        <span className="font-medium">{snapshot.participantCode}</span> ·
        answers are recorded as entered by the researcher.
      </div>
      <InterviewProvider
        config={snapshot.config}
        persistence={persistence}
        // The researcher opened this specific session: continue it directly.
        autoResume
      >
        {/* Dictation is deliberately disabled for researcher entry. */}
        <VoiceAdapterProvider adapter={unsupportedSpeechAdapter}>
          <InterviewRunner />
        </VoiceAdapterProvider>
      </InterviewProvider>
    </div>
  );
}
