"use client";

import { useEffect, useMemo, useState } from "react";

import { SessionLock } from "@/features/interview/persistence/session-lock";

interface SessionLockState {
  /** False when another tab has taken over this interview. */
  hasLock: boolean;
  reclaim: () => void;
}

/** Tracks whether this tab is the one editing the interview. */
export function useSessionLock(enabled: boolean): SessionLockState {
  const lock = useMemo(() => new SessionLock(), []);
  const [hasLock, setHasLock] = useState(true);

  useEffect(() => {
    if (!enabled) return;
    lock.start();
    const unsubscribe = lock.subscribe(setHasLock);
    return () => {
      unsubscribe();
      lock.stop();
    };
  }, [lock, enabled]);

  return {
    hasLock,
    reclaim: () => {
      lock.reclaim();
      setHasLock(true);
    },
  };
}
