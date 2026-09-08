import type { InterviewState } from "@/features/interview/state";
import type { InterviewSubmission } from "@/features/interview/submission";

/**
 * Persistence boundary. Phase 2 ships browser-local implementations; Phase 3
 * adds Supabase-backed ones behind the same interfaces so the engine and UI
 * do not change.
 */

export interface DraftStorage {
  /** Returns null when there is no draft, or it is for another config version. */
  load(version: string): Promise<InterviewState | null>;
  save(state: InterviewState): Promise<void>;
  clear(): Promise<void>;
}

export interface SubmissionResult {
  participantRef: string;
}

export interface SubmissionRepository {
  submit(submission: InterviewSubmission): Promise<SubmissionResult>;
}

export interface InterviewPersistence {
  drafts: DraftStorage;
  submissions: SubmissionRepository;
}
