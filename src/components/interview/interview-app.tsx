"use client";

import { useEffect, useMemo, useState } from "react";

import { InterviewRunner } from "@/components/interview/interview-runner";
import { InterviewShell } from "@/components/layout/interview-shell";
import { interviewConfig } from "@/config/interview";
import { InterviewProvider } from "@/features/interview/interview-provider";
import { resumeTokenStore } from "@/features/interview/persistence/resume-token-store";
import { sessionApi } from "@/features/interview/persistence/server-api";
import { SyncedPersistence } from "@/features/interview/persistence/synced";
import type { InterviewPersistence } from "@/features/interview/persistence/types";
import { VoiceAdapterProvider } from "@/features/voice/voice-adapter-context";
import type { InterviewConfig } from "@/types/interview";

interface Startup {
  config: InterviewConfig;
  /** True when the participant arrived through a resume link. */
  autoResume: boolean;
}

/**
 * Composition root for the participant app.
 *
 * A resumed session must run against the questionnaire version it started
 * on, so the frozen definition is fetched from the server before the engine
 * mounts. New sessions use the repository config, which is what the publish
 * script uploads.
 */
export function InterviewApp() {
  const [startup, setStartup] = useState<Startup | null>(null);

  useEffect(() => {
    let cancelled = false;
    const autoResume = resumeTokenStore.consumeAutoResume();
    const token = resumeTokenStore.read();

    const resolveConfig = token
      ? sessionApi
          .get(token)
          .then((snapshot) => snapshot.config)
          // Unreachable or invalid session: fall back to the current
          // questionnaire. SyncedPersistence decides what to do with the
          // stale token when it loads the draft.
          .catch(() => interviewConfig)
      : Promise.resolve(interviewConfig);

    void resolveConfig.then((config) => {
      if (!cancelled) setStartup({ config, autoResume });
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const persistence = useMemo<InterviewPersistence>(() => {
    const synced = new SyncedPersistence();
    return { drafts: synced, submissions: synced, sync: synced };
  }, []);

  if (!startup) {
    return (
      <InterviewShell>
        <p className="text-sm text-muted-foreground">Loading…</p>
      </InterviewShell>
    );
  }

  return (
    <InterviewProvider
      config={startup.config}
      persistence={persistence}
      autoResume={startup.autoResume}
    >
      <VoiceAdapterProvider>
        <InterviewRunner />
      </VoiceAdapterProvider>
    </InterviewProvider>
  );
}
