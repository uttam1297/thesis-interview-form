"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  SpeechRecognitionAdapter,
  VoiceError,
} from "@/features/voice/adapter";
import { useElapsedSeconds } from "@/hooks/useElapsedSeconds";

export type VoiceStatus = "unsupported" | "idle" | "listening" | "error";

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
    setStatus("listening");
    adapter.start({
      onTranscript: (text, isFinal) => {
        if (isFinal) {
          setInterimTranscript("");
          onFinalRef.current(text.trim());
        } else {
          setInterimTranscript(text);
        }
      },
      onError: (voiceError) => {
        setError(voiceError);
        setStatus("error");
      },
      onEnd: () => {
        setInterimTranscript("");
        setStatus((current) => (current === "error" ? current : "idle"));
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
