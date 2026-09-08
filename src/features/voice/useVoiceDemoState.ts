import { useState } from "react";

import { useElapsedSeconds } from "@/hooks/useElapsedSeconds";

const MOCK_TRANSCRIPT =
  "Normally our analytics team pulls the last quarter of usage data and cross-checks it against support tickets before we trust a trend.";

export type VoiceDemoStatus = "idle" | "listening";

interface UseVoiceDemoStateOptions {
  /** Called with the mock transcript once "listening" stops. */
  onCapture: (transcript: string) => void;
}

interface VoiceDemoState {
  status: VoiceDemoStatus;
  elapsedSeconds: number;
  start: () => void;
  stop: () => void;
}

/**
 * Mock voice capture state machine for the Phase 1 prototype. There is no
 * speech recognition here — stopping reports a placeholder transcript via
 * `onCapture` so the caller can drop it into its own editable text field.
 * Phase 2 replaces the body of `start`/`stop` with a real adapter; the
 * VoiceButton component and question pages do not change.
 */
export function useVoiceDemoState({
  onCapture,
}: UseVoiceDemoStateOptions): VoiceDemoState {
  const [status, setStatus] = useState<VoiceDemoStatus>("idle");
  const elapsedSeconds = useElapsedSeconds(status === "listening");

  return {
    status,
    elapsedSeconds,
    start: () => setStatus("listening"),
    stop: () => {
      setStatus("idle");
      onCapture(MOCK_TRANSCRIPT);
    },
  };
}
