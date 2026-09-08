"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  SpeechRecognitionAdapter,
  VoiceError,
} from "@/features/voice/adapter";
import { useElapsedSeconds } from "@/hooks/useElapsedSeconds";

/**
 * `requesting` covers the gap between the participant asking to speak and
 * the browser granting microphone access — during which nothing is being
 * recorded, so the UI must not claim otherwise.
 */
export type VoiceStatus =
  "unsupported" | "idle" | "requesting" | "listening" | "error" | "denied";

export interface VoiceInput {
  status: VoiceStatus;
  isSupported: boolean;
  /** Live, not-yet-final words — display only, never persisted. */
  interimTranscript: string;
  elapsedSeconds: number;
  error: VoiceError | null;
  start: () => void;
  stop: () => void;
}

interface UseVoiceInputOptions {
  adapter: SpeechRecognitionAdapter;
  /** Receives each finalised phrase so the caller can append it to its text. */
  onFinalTranscript: (text: string) => void;
}

/**
 * Manages one recognition session against an adapter. Owns status, interim
 * text and errors; the caller owns the actual answer text so the participant
 * can edit it freely before continuing.
 *
 * Once permission has been refused the control stays in `denied` and stops
 * offering to try again: browsers remember the refusal, so re-prompting only
 * produces a silent failure.
 */
export function useVoiceInput({
  adapter,
  onFinalTranscript,
}: UseVoiceInputOptions): VoiceInput {
  const [status, setStatus] = useState<VoiceStatus>(
    adapter.isSupported ? "idle" : "unsupported"
  );
  const [interimTranscript, setInterimTranscript] = useState("");
  const [error, setError] = useState<VoiceError | null>(null);
  const elapsedSeconds = useElapsedSeconds(status === "listening");

  // Latest-callback ref so a long recognition session always appends into
  // the caller's current text without restarting on every keystroke.
  const onFinalRef = useRef(onFinalTranscript);
  useEffect(() => {
    onFinalRef.current = onFinalTranscript;
  });

  useEffect(() => () => adapter.stop(), [adapter]);

  const start = useCallback(() => {
    if (!adapter.isSupported) return;
    setError(null);
    setInterimTranscript("");
    // Not "listening" yet: the browser may still be asking for permission.
    setStatus("requesting");

    adapter.start({
      onTranscript: (text, isFinal) => {
        // The first result proves the microphone is actually live.
        setStatus("listening");
        if (isFinal) {
          setInterimTranscript("");
          onFinalRef.current(text.trim());
        } else {
          setInterimTranscript(text);
        }
      },
      onStart: () => setStatus("listening"),
      onError: (voiceError) => {
        setError(voiceError);
        setStatus(voiceError.code === "permission-denied" ? "denied" : "error");
      },
      onEnd: () => {
        setInterimTranscript("");
        setStatus((current) =>
          current === "error" || current === "denied" ? current : "idle"
        );
      },
    });
  }, [adapter]);

  const stop = useCallback(() => {
    adapter.stop();
  }, [adapter]);

  return {
    status,
    isSupported: adapter.isSupported,
    interimTranscript,
    elapsedSeconds,
    error,
    start,
    stop,
  };
}
