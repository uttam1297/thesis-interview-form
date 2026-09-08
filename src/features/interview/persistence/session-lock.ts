const LOCK_KEY = "interview:active-tab";
const HEARTBEAT_MS = 2000;
// Generous, because browsers throttle timers in background tabs: a tab you
// are simply not looking at must not be mistaken for a closed one.
const STALE_AFTER_MS = 30000;

interface LockRecord {
  tabId: string;
  updatedAt: number;
}

/**
 * Detects the same interview open in more than one tab.
 *
 * Answers are keyed per question and the server takes the last write, so a
 * second tab holding older state could quietly overwrite newer answers.
 * Rather than merging, the tab that already holds the session keeps it and
 * a newly opened one is told to stand down — nothing is yanked away from a
 * participant mid-answer. Taking over is possible, but only explicitly.
 * A lock whose heartbeat has gone stale is treated as a closed tab, and the
 * tab the participant is actually looking at reclaims on becoming visible —
 * so returning to an older tab hands the session back rather than leaving
 * it stuck behind a warning.
 */
export class SessionLock {
  private readonly tabId = Math.random().toString(36).slice(2);
  private timer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<(hasLock: boolean) => void>();
  private hasLock = true;

  start(): void {
    if (typeof window === "undefined") return;
    this.claim();
    this.timer = setInterval(() => this.claim(), HEARTBEAT_MS);
    window.addEventListener("storage", this.onStorage);
    document.addEventListener("visibilitychange", this.onVisibilityChange);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", this.onStorage);
      document.removeEventListener("visibilitychange", this.onVisibilityChange);
    }
    this.listeners.clear();
  }

  subscribe(listener: (hasLock: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  getHasLock(): boolean {
    return this.hasLock;
  }

  /** Take the session back in this tab, standing down the other one. */
  reclaim(): void {
    this.write();
    this.setHasLock(true);
  }

  /** The visible tab is the one being used, so it takes the session back. */
  private onVisibilityChange = () => {
    if (document.visibilityState === "visible") this.reclaim();
  };

  private onStorage = (event: StorageEvent) => {
    if (event.key !== LOCK_KEY || !event.newValue) return;
    try {
      const record = JSON.parse(event.newValue) as LockRecord;
      if (record.tabId !== this.tabId) this.setHasLock(false);
    } catch {
      // Unreadable lock record: leave this tab's state as it is.
    }
  };

  private claim(): void {
    const record = this.read();
    const stale = !record || Date.now() - record.updatedAt > STALE_AFTER_MS;
    if (!record || record.tabId === this.tabId || stale) {
      this.write();
      this.setHasLock(true);
    } else {
      this.setHasLock(false);
    }
  }

  private read(): LockRecord | null {
    try {
      const raw = window.localStorage.getItem(LOCK_KEY);
      return raw ? (JSON.parse(raw) as LockRecord) : null;
    } catch {
      return null;
    }
  }

  private write(): void {
    try {
      const record: LockRecord = { tabId: this.tabId, updatedAt: Date.now() };
      window.localStorage.setItem(LOCK_KEY, JSON.stringify(record));
    } catch {
      // Storage unavailable: single-tab behaviour, which is the safe default.
    }
  }

  private setHasLock(next: boolean): void {
    if (this.hasLock === next) return;
    this.hasLock = next;
    this.listeners.forEach((listener) => listener(next));
  }
}
