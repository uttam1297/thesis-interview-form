"use client";

import { Mic, Square } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

import { Button } from "@/components/ui/button";
import { transitions } from "@/lib/motion";

interface VoiceButtonProps {
  status: "idle" | "listening";
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
 * Presentational voice control. Holds no recognition/transcription logic —
 * it only reports start/stop intent. The caller owns the actual capture
 * (Phase 2 voice adapter) and swaps in an editable text field once done.
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

  return (
    <div className="flex flex-col items-start gap-1.5">
      <Button
        type="button"
        variant="outline"
        onClick={isListening ? onStop : onStart}
        disabled={disabled}
        aria-pressed={isListening}
        className="relative"
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
          {isListening ? (
            <Square className="relative size-3.5 fill-current text-destructive" />
          ) : (
            <Mic className="relative size-4" />
          )}
        </span>
        {isListening ? (
          <>
            Listening<span aria-hidden="true">…</span>{" "}
            <span className="tabular-nums">
              {formatElapsed(elapsedSeconds)}
            </span>
          </>
        ) : (
          "Speak answer"
        )}
      </Button>
      <span role="status" className="sr-only">
        {isListening ? "Listening for your answer" : ""}
      </span>
    </div>
  );
}
