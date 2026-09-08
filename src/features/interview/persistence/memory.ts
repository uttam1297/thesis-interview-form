import type {
  DraftStorage,
  SubmissionRepository,
  SubmissionResult,
} from "@/features/interview/persistence/types";
import type { InterviewState } from "@/features/interview/state";
import type { InterviewSubmission } from "@/features/interview/submission";

/** In-memory implementations for tests and server rendering. */

export class MemoryDraftStorage implements DraftStorage {
  draft: InterviewState | null = null;

  async load(version: string): Promise<InterviewState | null> {
    return this.draft?.version === version ? this.draft : null;
  }

  async save(state: InterviewState): Promise<void> {
    this.draft = state;
  }

  async clear(): Promise<void> {
    this.draft = null;
  }
}

export class MemorySubmissionRepository implements SubmissionRepository {
  submissions: InterviewSubmission[] = [];

  async submit(submission: InterviewSubmission): Promise<SubmissionResult> {
    this.submissions.push(submission);
    return {
      participantRef: `P${String(this.submissions.length).padStart(3, "0")}`,
    };
  }
}
