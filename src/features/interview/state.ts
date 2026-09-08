import type { ResponseRecord } from "@/types/interview";

export type InterviewStatus = "not_started" | "in_progress" | "submitted";

export interface ConsentState {
  accepted: boolean;
  version: string;
  acceptedAt: string;
  /**
   * Null means recording was not asked about. Never inferred from
   * participation consent — the two are recorded separately.
   */
  recordingConsent?: boolean | null;
}

/**
 * Everything the engine needs to resume exactly where a participant left
 * off. Serialisable as-is — this is what DraftStorage persists.
 */
export interface InterviewState {
  /** Questionnaire config version the draft was created against. */
  version: string;
  status: InterviewStatus;
  consent: ConsentState | null;
  responses: Record<string, ResponseRecord>;
  /** Id of the current step (see steps.ts). */
  currentStepId: string;
  /** Set when a participant jumps back from the review screen to edit. */
  returnToReview: boolean;
  startedAt: string | null;
  updatedAt: string;
  submittedAt: string | null;
  participantRef: string | null;
}

export function createInitialState(
  version: string,
  now: string
): InterviewState {
  return {
    version,
    status: "not_started",
    consent: null,
    responses: {},
    currentStepId: "welcome",
    returnToReview: false,
    startedAt: null,
    updatedAt: now,
    submittedAt: null,
    participantRef: null,
  };
}
