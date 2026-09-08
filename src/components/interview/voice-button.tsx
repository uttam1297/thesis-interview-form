"use client";

import { Loader2, Mic, Square } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { transitions } from "@/lib/motion";

interface VoiceButtonProps {
  status: "idle" | "requesting" | "listening";
  elapsedSeconds?: number;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
}

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60)
    .toString()
    .padStart(2, "0");
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, "0");
  return `${minutes}:${seconds}`;
}

/**
 * Presentational voice control. Holds no recognition logic — it reports
 * start/stop intent and shows the state it is given. "Requesting" is
 * distinct from "listening" so the control never implies it is recording
 * while the browser is still asking for permission.
 */
export function VoiceButton({
  status,
  elapsedSeconds = 0,
  onStart,
  onStop,
  disabled,
}: VoiceButtonProps) {
  const prefersReducedMotion = useReducedMotion();
  const isListening = status === "listening";
  const isRequesting = status === "requesting";

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={isListening ? onStop : onStart}
        disabled={disabled || isRequesting}
        aria-pressed={isListening}
        className="relative min-h-11"
      >
        <span className="relative flex size-4 items-center justify-center">
          {isListening && (
            <motion.span
              className="absolute inline-flex size-4 rounded-full bg-destructive/40"
              animate={
                prefersReducedMotion
                  ? { opacity: 0.4 }
                  : { scale: [1, 1.8], opacity: [0.5, 0] }
              }
              transition={
                prefersReducedMotion
                  ? transitions.base
                  : { duration: 1.2, repeat: Infinity, ease: "easeOut" }
              }
            />
          )}
          {isRequesting ? (
            <Loader2 className="relative size-4 animate-spin" />
          ) : isListening ? (
            <Square className="relative size-3.5 fill-current text-destructive" />
          ) : (
            <Mic className="relative size-4" />
          )}
        </span>
        {isRequesting ? (
          "Waiting for microphone…"
        ) : isListening ? (
          <>
            Stop recording{" "}
            <span className="tabular-nums">
              {formatElapsed(elapsedSeconds)}
            </span>
          </>
        ) : (
          "Speak answer"
        )}
      </Button>

      {/* Announced to screen readers as the state changes. */}
      <span role="status" aria-live="polite" className="sr-only">
        {isRequesting
          ? "Waiting for microphone permission"
          : isListening
            ? "Listening. Your words appear in the answer box."
            : ""}
      </span>
    </div>
  );
}
