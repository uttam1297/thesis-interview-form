import type { InterviewState } from "@/features/interview/state";
import type { InterviewSubmission } from "@/features/interview/submission";
import type { SyncStatus } from "@/features/interview/persistence/sync-queue";

/**
 * Persistence boundary. Phase 2 shipped browser-local implementations;
 * Phase 3 adds a synced implementation that writes locally *and* to the
 * server behind the same interfaces, so the engine and screens are
 * unchanged.
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

/**
 * Optional: server-backed implementations expose their sync state so the
 * participant can see saving/saved/offline and retry. Local-only
 * implementations omit it.
 */
export interface SyncStatusSource {
  subscribe(listener: (status: SyncStatus) => void): () => void;
  getStatus(): SyncStatus;
  retry(): void;
  /** Link the participant can use to continue on another device. */
  getResumeToken(): string | null;
}

export interface InterviewPersistence {
  drafts: DraftStorage;
  submissions: SubmissionRepository;
  sync?: SyncStatusSource;
}
