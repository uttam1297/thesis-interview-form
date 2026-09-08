import { ApiError } from "@/features/interview/persistence/server-api";

export type SyncStatus = "idle" | "saving" | "saved" | "offline" | "error";

interface SyncQueueOptions<T> {
  /** Performs one flush of the accumulated payload. */
  send: (payload: T) => Promise<void>;
  /** Merges a newly queued item into the pending payload. */
  merge: (pending: T | null, next: T) => T;
  onStatusChange: (status: SyncStatus) => void;
  debounceMs?: number;
  maxAttempts?: number;
  /** Injectable for tests. */
  setTimer?: (fn: () => void, ms: number) => ReturnType<typeof setTimeout>;
  clearTimer?: (handle: ReturnType<typeof setTimeout>) => void;
}

const BACKOFF_MS = [1000, 2000, 5000, 10000, 20000, 30000];

/**
 * Debounced, retrying outbound queue for participant answers.
 *
 * Work is never dropped: a failed flush keeps its payload, merges anything
 * queued since, and retries with backoff. Callers keep writing to the local
 * draft regardless, so a network outage cannot lose typed text.
 */
export class SyncQueue<T> {
  private pending: T | null = null;
  private inFlight = false;
  private attempt = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly debounceMs: number;
  private readonly maxAttempts: number;
  private readonly setTimer: NonNullable<SyncQueueOptions<T>["setTimer"]>;
  private readonly clearTimer: NonNullable<SyncQueueOptions<T>["clearTimer"]>;

  constructor(private readonly options: SyncQueueOptions<T>) {
    this.debounceMs = options.debounceMs ?? 800;
    this.maxAttempts = options.maxAttempts ?? BACKOFF_MS.length;
    this.setTimer = options.setTimer ?? ((fn, ms) => setTimeout(fn, ms));
    this.clearTimer = options.clearTimer ?? ((handle) => clearTimeout(handle));
  }

  /** Queues a change and schedules a debounced flush. */
  enqueue(item: T): void {
    this.pending = this.options.merge(this.pending, item);
    this.schedule(this.debounceMs);
  }

  /** Sends everything pending now, e.g. before submitting. */
  async flush(): Promise<void> {
    if (this.timer) {
      this.clearTimer(this.timer);
      this.timer = null;
    }
    await this.run();
    if (this.pending !== null) {
      throw new ApiError("network", 0);
    }
  }

  get hasPending(): boolean {
    return this.pending !== null;
  }

  dispose(): void {
    if (this.timer) this.clearTimer(this.timer);
    this.timer = null;
  }

  private schedule(delay: number): void {
    if (this.timer) this.clearTimer(this.timer);
    this.timer = this.setTimer(() => {
      this.timer = null;
      void this.run();
    }, delay);
  }

  private async run(): Promise<void> {
    if (this.inFlight || this.pending === null) return;

    const payload = this.pending;
    this.pending = null;
    this.inFlight = true;
    this.options.onStatusChange("saving");

    try {
      await this.options.send(payload);
      this.attempt = 0;
      this.options.onStatusChange(this.pending === null ? "saved" : "saving");
      if (this.pending !== null) this.schedule(0);
    } catch (error) {
      // Put the work back, newest changes last, and retry with backoff.
      this.pending = this.options.merge(payload, this.pending as T);
      this.attempt += 1;
      const offline = error instanceof ApiError && error.code === "network";
      if (this.attempt >= this.maxAttempts) {
        this.options.onStatusChange(offline ? "offline" : "error");
      } else {
        this.options.onStatusChange(offline ? "offline" : "saving");
        this.schedule(
          BACKOFF_MS[Math.min(this.attempt, BACKOFF_MS.length - 1)]
        );
      }
    } finally {
      this.inFlight = false;
    }
  }

  /** Manual retry from the UI after a give-up. */
  retryNow(): void {
    this.attempt = 0;
    this.schedule(0);
  }
}
