"use client";

import { useMemo } from "react";

import { InterviewRunner } from "@/components/interview/interview-runner";
import { interviewConfig } from "@/config/interview";
import { InterviewProvider } from "@/features/interview/interview-provider";
import {
  LocalDraftStorage,
  LocalSubmissionRepository,
} from "@/features/interview/persistence/local-storage";
import type { InterviewPersistence } from "@/features/interview/persistence/types";
import { VoiceAdapterProvider } from "@/features/voice/voice-adapter-context";

/**
 * Composition root for the participant app: wires the config and the
 * Phase 2 (browser-local) persistence into the engine. Phase 3 swaps the
 * persistence object here and nothing below changes.
 */
export function InterviewApp() {
  const persistence = useMemo<InterviewPersistence>(
    () => ({
      drafts: new LocalDraftStorage(),
      submissions: new LocalSubmissionRepository(),
    }),
    []
  );

  return (
    <InterviewProvider config={interviewConfig} persistence={persistence}>
      <VoiceAdapterProvider>
        <InterviewRunner />
      </VoiceAdapterProvider>
    </InterviewProvider>
  );
}
