import type {
  DraftStorage,
  SubmissionRepository,
  SubmissionResult,
} from "@/features/interview/persistence/types";
import type { InterviewState } from "@/features/interview/state";
import type { InterviewSubmission } from "@/features/interview/submission";

const DRAFT_KEY = "interview:draft";
const SUBMISSIONS_KEY = "interview:submissions";

function readJson<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

/** Browser-local draft persistence so a refresh resumes the session. */
export class LocalDraftStorage implements DraftStorage {
  async load(version: string): Promise<InterviewState | null> {
    const draft = readJson<InterviewState>(DRAFT_KEY);
    if (!draft || draft.version !== version) return null;
    return draft;
  }

  async save(state: InterviewState): Promise<void> {
    writeJson(DRAFT_KEY, state);
  }

  async clear(): Promise<void> {
    window.localStorage.removeItem(DRAFT_KEY);
  }
}

/**
 * Simulated submission for Phase 2: appends to a local list and mints a
 * participant reference. Phase 3 replaces this with a Supabase repository.
 */
export class LocalSubmissionRepository implements SubmissionRepository {
  async submit(submission: InterviewSubmission): Promise<SubmissionResult> {
    const existing = readJson<InterviewSubmission[]>(SUBMISSIONS_KEY) ?? [];
    const participantRef = `P${String(existing.length + 1).padStart(3, "0")}`;
    writeJson(SUBMISSIONS_KEY, [
      ...existing,
      { ...submission, participantRef },
    ]);
    return { participantRef };
  }
}
