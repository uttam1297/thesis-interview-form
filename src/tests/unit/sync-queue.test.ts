import { describe, expect, it, vi } from "vitest";

import { ApiError } from "@/features/interview/persistence/server-api";
import {
  SyncQueue,
  type SyncStatus,
} from "@/features/interview/persistence/sync-queue";

/** Runs queued timers immediately so backoff can be tested synchronously. */
function immediateTimers() {
  const pending: Array<() => void> = [];
  return {
    setTimer: (fn: () => void) => {
      pending.push(fn);
      return pending.length as unknown as ReturnType<typeof setTimeout>;
    },
    clearTimer: () => {},
    async runAll() {
      while (pending.length > 0) {
        const fn = pending.shift()!;
        fn();
        await Promise.resolve();
        await Promise.resolve();
      }
    },
  };
}

type Payload = { items: string[] };

function makeQueue(
  send: (payload: Payload) => Promise<void>,
  statuses: SyncStatus[]
) {
  const timers = immediateTimers();
  const queue = new SyncQueue<Payload>({
    send,
    merge: (pending, next) => ({
      items: [...(pending?.items ?? []), ...(next?.items ?? [])],
    }),
    onStatusChange: (status) => statuses.push(status),
    setTimer: timers.setTimer,
    clearTimer: timers.clearTimer,
  });
  return { queue, timers };
}

describe("SyncQueue", () => {
  it("coalesces queued items into a single send", async () => {
    const sent: Payload[] = [];
    const statuses: SyncStatus[] = [];
    const { queue, timers } = makeQueue(async (payload) => {
      sent.push(payload);
    }, statuses);

    queue.enqueue({ items: ["a"] });
    queue.enqueue({ items: ["b"] });
    await timers.runAll();

    expect(sent).toEqual([{ items: ["a", "b"] }]);
    expect(statuses).toContain("saved");
  });

  it("keeps the payload and reports offline when the network fails", async () => {
    const statuses: SyncStatus[] = [];
    const send = vi.fn().mockRejectedValue(new ApiError("network", 0));
    const { queue, timers } = makeQueue(send, statuses);

    queue.enqueue({ items: ["a"] });
    await timers.runAll();

    expect(send).toHaveBeenCalled();
    expect(statuses).toContain("offline");
    // Nothing is dropped: the work is still pending for a later retry.
    expect(queue.hasPending).toBe(true);
  });

  it("re-sends the failed work once the connection returns", async () => {
    const statuses: SyncStatus[] = [];
    const delivered: string[] = [];
    let failNext = true;
    const send = vi.fn(async (payload: Payload) => {
      if (failNext) {
        failNext = false;
        throw new ApiError("network", 0);
      }
      delivered.push(...payload.items);
    });
    const { queue, timers } = makeQueue(send, statuses);

    queue.enqueue({ items: ["a"] });
    queue.enqueue({ items: ["b"] });
    await timers.runAll();

    // The first attempt failed, and its items were redelivered on retry.
    expect(delivered).toEqual(["a", "b"]);
    expect(queue.hasPending).toBe(false);
    expect(statuses).toContain("offline");
    expect(statuses.at(-1)).toBe("saved");
  });

  it("gives up after the retry budget and reports an error state", async () => {
    const statuses: SyncStatus[] = [];
    const send = vi.fn().mockRejectedValue(new ApiError("unavailable", 503));
    const { queue, timers } = makeQueue(send, statuses);

    queue.enqueue({ items: ["a"] });
    await timers.runAll();

    expect(statuses.at(-1)).toBe("error");
    expect(queue.hasPending).toBe(true);
  });

  it("flush rejects while work is still pending", async () => {
    const send = vi.fn().mockRejectedValue(new ApiError("network", 0));
    const { queue } = makeQueue(send, []);
    queue.enqueue({ items: ["a"] });
    await expect(queue.flush()).rejects.toBeInstanceOf(ApiError);
  });
});
