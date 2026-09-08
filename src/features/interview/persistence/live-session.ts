import {
  ApiError,
  sessionApi,
  type SessionSnapshotDto,
} from "@/features/interview/persistence/server-api";
import {
  SyncQueue,
  type SyncStatus,
} from "@/features/interview/persistence/sync-queue";
import type {
  DraftStorage,
  SubmissionRepository,
  SubmissionResult,
  SyncStatusSource,
} from "@/features/interview/persistence/types";
import type { InterviewState } from "@/features/interview/state";
import type { InterviewSubmission } from "@/features/interview/submission";
import type { ResponseRecord } from "@/types/interview";

interface QueuePayload {
  responses: Map<string, ResponseRecord>;
  currentStepId?: string;
  returnToReview?: boolean;
}

/**
 * Persistence for researcher-entered live interviews. Server-only: nothing
 * is written to local storage, because one researcher may run several
 * interviews from the same browser and a stray draft must not leak between
 * participants. Answers are recorded with method "researcher" so exports
 * never present them as the participant's own wording.
 */
export class LiveSessionPersistence
  implements DraftStorage, SubmissionRepository, SyncStatusSource
{
  private readonly queue: SyncQueue<QueuePayload>;
  private readonly listeners = new Set<(status: SyncStatus) => void>();
  private status: SyncStatus = "idle";
  private synced = new Map<string, string>();

  constructor(
    private readonly resumeToken: string,
    private readonly snapshot: SessionSnapshotDto
  ) {
    this.synced = new Map(
      Object.entries(snapshot.responses).map(([key, record]) => [
        key,
        fingerprint(record),
      ])
    );
    this.queue = new SyncQueue<QueuePayload>({
      send: (payload) => this.send(payload),
      merge: (pending, next) => {
        if (!pending) return next;
        const responses = new Map(pending.responses);
        for (const [key, record] of next.responses) responses.set(key, record);
        return {
          responses,
          currentStepId: next.currentStepId ?? pending.currentStepId,
          returnToReview: next.returnToReview ?? pending.returnToReview,
        };
      },
      onStatusChange: (status) => {
        this.status = status;
        this.listeners.forEach((listener) => listener(status));
      },
    });
  }

  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  retry(): void {
    this.queue.retryNow();
  }

  /** Live sessions are never continued from a shared link. */
  getResumeToken(): string | null {
    return null;
  }

  async load(version: string): Promise<InterviewState | null> {
    if (this.snapshot.questionnaireVersion !== version) return null;
    return {
      version,
      status:
        this.snapshot.status === "completed" ? "submitted" : "in_progress",
      consent: this.snapshot.consent
        ? {
            accepted: this.snapshot.consent.participationConsent,
            version: this.snapshot.consent.version,
            acceptedAt: this.snapshot.consent.consentedAt,
            recordingConsent: this.snapshot.consent.recordingConsent,
          }
        : null,
      responses: this.snapshot.responses,
      currentStepId: this.snapshot.currentStepId,
      returnToReview: this.snapshot.returnToReview,
      startedAt: this.snapshot.startedAt,
      updatedAt: new Date().toISOString(),
      submittedAt: this.snapshot.completedAt,
      participantRef:
        this.snapshot.status === "completed"
          ? this.snapshot.participantCode
          : null,
    };
  }

  async save(state: InterviewState): Promise<void> {
    const changed = new Map<string, ResponseRecord>();
    for (const [key, record] of Object.entries(state.responses)) {
      if (this.synced.get(key) !== fingerprint(record))
        changed.set(key, record);
    }
    this.queue.enqueue({
      responses: changed,
      currentStepId: state.currentStepId,
      returnToReview: state.returnToReview,
    });
  }

  async clear(): Promise<void> {
    this.queue.dispose();
  }

  async submit(_submission: InterviewSubmission): Promise<SubmissionResult> {
    void _submission;
    await this.queue.flush();
    const { participantCode } = await sessionApi.submit(this.resumeToken);
    return { participantRef: participantCode };
  }

  private async send(payload: QueuePayload): Promise<void> {
    if (payload.responses.size === 0 && !payload.currentStepId) return;
    const responses = [...payload.responses.values()].map((record) => ({
      questionKey: record.questionId,
      value: record.value,
      skipped: record.skipped,
      // Attribution: entered by the researcher, not spoken/typed by the
      // participant into the form.
      method: "researcher" as const,
      updatedAt: record.updatedAt,
    }));

    try {
      await sessionApi.save(this.resumeToken, {
        responses,
        currentStepId: payload.currentStepId,
        returnToReview: payload.returnToReview,
      });
    } catch (error) {
      throw error instanceof ApiError ? error : new ApiError("network", 0);
    }

    for (const record of payload.responses.values()) {
      this.synced.set(record.questionId, fingerprint(record));
    }
  }
}

function fingerprint(record: ResponseRecord): string {
  return JSON.stringify([record.value, record.skipped, record.method]);
}
