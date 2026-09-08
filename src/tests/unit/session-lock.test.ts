import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SessionLock } from "@/features/interview/persistence/session-lock";

const LOCK_KEY = "interview:active-tab";

describe("SessionLock", () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("gives the lock to the only open tab", () => {
    const lock = new SessionLock();
    lock.start();
    expect(lock.getHasLock()).toBe(true);
    expect(window.localStorage.getItem(LOCK_KEY)).not.toBeNull();
    lock.stop();
  });

  it("keeps the session in the tab that already holds it", () => {
    const first = new SessionLock();
    first.start();
    expect(first.getHasLock()).toBe(true);

    const second = new SessionLock();
    second.start();

    // No silent takeover: the participant may be mid-answer in the first tab.
    expect(second.getHasLock()).toBe(false);
    expect(first.getHasLock()).toBe(true);

    first.stop();
    second.stop();
  });

  it("lets the second tab take over, but only when asked", () => {
    const first = new SessionLock();
    const second = new SessionLock();
    first.start();
    second.start();
    expect(second.getHasLock()).toBe(false);

    second.reclaim();
    expect(second.getHasLock()).toBe(true);

    // The original tab notices on its next heartbeat and stands down.
    vi.advanceTimersByTime(2100);
    expect(first.getHasLock()).toBe(false);

    first.stop();
    second.stop();
  });

  it("takes over a lock left behind by a closed tab", () => {
    window.localStorage.setItem(
      LOCK_KEY,
      JSON.stringify({ tabId: "gone", updatedAt: Date.now() - 60_000 })
    );

    const lock = new SessionLock();
    lock.start();
    // A stale heartbeat means that tab is gone, not competing.
    expect(lock.getHasLock()).toBe(true);
    lock.stop();
  });

  it("notifies subscribers when the lock is lost", () => {
    const first = new SessionLock();
    const changes: boolean[] = [];
    first.start();
    first.subscribe((hasLock) => changes.push(hasLock));

    const second = new SessionLock();
    second.start();
    second.reclaim();
    vi.advanceTimersByTime(2100);

    expect(changes).toContain(false);
    first.stop();
    second.stop();
  });
});
