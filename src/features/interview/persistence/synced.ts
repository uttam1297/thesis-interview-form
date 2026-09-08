import { LocalDraftStorage } from "@/features/interview/persistence/local-storage";
import { resumeTokenStore } from "@/features/interview/persistence/resume-token-store";
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
 * Layered persistence: every change is written to the local draft first and
 * then queued for the server. A network outage degrades to "offline" but
 * never loses typed text, and the queue drains once connectivity returns.
 */
export class SyncedPersistence
  implements DraftStorage, SubmissionRepository, SyncStatusSource
{
  private readonly local = new LocalDraftStorage();
  private readonly queue: SyncQueue<QueuePayload>;
  private readonly listeners = new Set<(status: SyncStatus) => void>();
  private status: SyncStatus = "idle";
  private resumeToken: string | null = null;
  /** Answers as last confirmed by the server, to compute what changed. */
  private synced = new Map<string, string>();
  private creatingSession: Promise<void> | null = null;

  constructor() {
    this.queue = new SyncQueue<QueuePayload>({
      send: (payload) => this.send(payload),
      merge: (pending, next) => mergePayloads(pending, next),
      onStatusChange: (status) => this.setStatus(status),
    });
  }

  /* ----- SyncStatusSource ----- */

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

  getResumeToken(): string | null {
    return this.resumeToken;
  }

  private setStatus(status: SyncStatus): void {
    this.status = status;
    this.listeners.forEach((listener) => listener(status));
  }

  /* ----- DraftStorage ----- */

  /**
   * Reconciles the local draft with the server session. The server is the
   * record of truth; a local answer only wins when it is newer, which is
   * exactly the case where the last sync did not complete.
   */
  async load(version: string): Promise<InterviewState | null> {
    const localDraft = await this.local.load(version);
    const token = resumeTokenStore.read();
    if (!token) return localDraft;

    this.resumeToken = token;

    let snapshot: SessionSnapshotDto;
    try {
      snapshot = await sessionApi.get(token);
    } catch (error) {
      if (error instanceof ApiError && error.code === "network") {
        // Offline: work from the local draft and sync when we reconnect.
        this.setStatus("offline");
        return localDraft;
      }
      if (error instanceof ApiError && error.code === "already_completed") {
        // Nothing more to do with this session; the UI closes the loop.
        resumeTokenStore.clear();
        this.resumeToken = null;
        await this.local.clear();
        return null;
      }
      // Invalid, expired or unknown token. Keep any local answers: the next
      // save creates a fresh session and uploads them.
      resumeTokenStore.clear();
      this.resumeToken = null;
      return localDraft;
    }

    if (snapshot.questionnaireVersion !== version) {
      // The published questionnaire moved on; this draft cannot continue.
      resumeTokenStore.clear();
      this.resumeToken = null;
      await this.local.clear();
      return null;
    }

    this.synced = new Map(
      Object.entries(snapshot.responses).map(([key, record]) => [
        key,
        fingerprint(record),
      ])
    );

    const merged = mergeSnapshotWithDraft(version, snapshot, localDraft);
    await this.local.save(merged);
    return merged;
  }

  async save(state: InterviewState): Promise<void> {
    // Local first: this must not depend on the network.
    await this.local.save(state);

    if (!state.consent?.accepted) return;
    if (!this.resumeToken) {
      await this.ensureSession(state);
      if (!this.resumeToken) return; // Session creation failed; retried on next save.
    }

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
    this.synced.clear();
    this.resumeToken = null;
    resumeTokenStore.clear();
    await this.local.clear();
  }

  /* ----- SubmissionRepository ----- */

  async submit(_submission: InterviewSubmission): Promise<SubmissionResult> {
    void _submission; // The server already holds every answer.
    if (!this.resumeToken) {
      throw new Error("This session is not connected to the server.");
    }
    // Everything must be on the server before the session is closed.
    await this.queue.flush();
    const { participantCode } = await sessionApi.submit(this.resumeToken);
    resumeTokenStore.clear();
    this.resumeToken = null;
    await this.local.clear();
    this.setStatus("saved");
    return { participantRef: participantCode };
  }

  /* ----- internals ----- */

  private async ensureSession(state: InterviewState): Promise<void> {
    // Concurrent saves must not create two sessions.
    this.creatingSession ??= this.createSession(state).finally(() => {
      this.creatingSession = null;
    });
    await this.creatingSession;
  }

  private async createSession(state: InterviewState): Promise<void> {
    const consent = state.consent;
    if (!consent?.accepted) return;
    try {
      this.setStatus("saving");
      const { resumeToken } = await sessionApi.start({
        consentVersion: consent.version,
        participationConsent: true,
        recordingConsent: consent.recordingConsent ?? null,
      });
      this.resumeToken = resumeToken;
      resumeTokenStore.write(resumeToken);
      // A recovered session starts empty, so everything is unsynced.
      this.synced.clear();
    } catch (error) {
      this.setStatus(
        error instanceof ApiError && error.code === "network"
          ? "offline"
          : "error"
      );
    }
  }

  private async send(payload: QueuePayload): Promise<void> {
    if (!this.resumeToken) throw new ApiError("network", 0);
    const responses = [...payload.responses.values()].map((record) => ({
      questionKey: record.questionId,
      value: record.value,
      skipped: record.skipped,
      method: record.method,
      updatedAt: record.updatedAt,
    }));

    await sessionApi.save(this.resumeToken, {
      responses,
      currentStepId: payload.currentStepId,
      returnToReview: payload.returnToReview,
    });

    for (const record of payload.responses.values()) {
      this.synced.set(record.questionId, fingerprint(record));
    }
  }
}

function fingerprint(record: ResponseRecord): string {
  return JSON.stringify([record.value, record.skipped, record.method]);
}

function mergePayloads(
  pending: QueuePayload | null,
  next: QueuePayload | null
): QueuePayload {
  if (!pending) return next ?? { responses: new Map() };
  if (!next) return pending;
  const responses = new Map(pending.responses);
  for (const [key, record] of next.responses) responses.set(key, record);
  return {
    responses,
    currentStepId: next.currentStepId ?? pending.currentStepId,
    returnToReview: next.returnToReview ?? pending.returnToReview,
  };
}

/** Server answers win unless the local draft holds a strictly newer edit. */
function mergeSnapshotWithDraft(
  version: string,
  snapshot: SessionSnapshotDto,
  draft: InterviewState | null
): InterviewState {
  const responses = { ...snapshot.responses };
  let localIsNewer = false;

  for (const [key, localRecord] of Object.entries(draft?.responses ?? {})) {
    const serverRecord = responses[key];
    if (!serverRecord || localRecord.updatedAt > serverRecord.updatedAt) {
      responses[key] = localRecord;
      localIsNewer = true;
    }
  }

  const useLocalPosition =
    localIsNewer && draft !== null && draft.updatedAt > snapshot.startedAt;

  return {
    version,
    status: snapshot.status === "completed" ? "submitted" : "in_progress",
    consent: snapshot.consent
      ? {
          accepted: snapshot.consent.participationConsent,
          version: snapshot.consent.version,
          acceptedAt: snapshot.consent.consentedAt,
          recordingConsent: snapshot.consent.recordingConsent,
        }
      : (draft?.consent ?? null),
    responses,
    currentStepId: useLocalPosition
      ? (draft?.currentStepId ?? snapshot.currentStepId)
      : snapshot.currentStepId,
    returnToReview: snapshot.returnToReview,
    startedAt: snapshot.startedAt,
    updatedAt: new Date().toISOString(),
    submittedAt: snapshot.completedAt,
    participantRef:
      snapshot.status === "completed" ? snapshot.participantCode : null,
  };
}
