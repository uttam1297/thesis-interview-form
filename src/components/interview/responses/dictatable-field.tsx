"use client";

import { useCallback } from "react";

import { StatusMessage } from "@/components/feedback/status-message";
import { VoiceButton } from "@/components/interview/voice-button";
import { Textarea } from "@/components/ui/textarea";
import { useVoiceInput } from "@/features/voice/use-voice-input";
import { useSpeechAdapter } from "@/features/voice/voice-adapter-context";
import type { ResponseMethod } from "@/types/interview";

interface DictatableFieldProps {
  value: string;
  onChange: (text: string, method: ResponseMethod) => void;
  labelId: string;
  describedById?: string;
  speechConsented: boolean;
  rows?: number;
  placeholder?: string;
  maxLength?: number;
  required?: boolean;
}

/** Text is always available; dictation appears only when consented and supported. */
export function DictatableField({
  value,
  onChange,
  labelId,
  describedById,
  speechConsented,
  rows = 4,
  placeholder = "Type your answer…",
  maxLength,
  required = false,
}: DictatableFieldProps) {
  const adapter = useSpeechAdapter();
  const appendTranscript = useCallback(
    (phrase: string) => {
      if (!phrase) return;
      const separator = value.length === 0 || /\s$/.test(value) ? "" : " ";
      onChange(`${value}${separator}${phrase}`, "voice");
    },
    [value, onChange]
  );
  const voice = useVoiceInput({ adapter, onFinalTranscript: appendTranscript });
  const active = voice.status === "listening" || voice.status === "requesting";
  const canDictate =
    speechConsented &&
    voice.isSupported &&
    voice.status !== "denied" &&
    voice.status !== "error";

  return (
    <div className="flex flex-col gap-3">
      {canDictate && (
        <div className="flex flex-wrap items-center gap-3">
          <VoiceButton
            status={
              voice.status === "requesting"
                ? "requesting"
                : voice.status === "listening"
                  ? "listening"
                  : "idle"
            }
            elapsedSeconds={voice.elapsedSeconds}
            onStart={voice.start}
            onStop={voice.stop}
          />
          <span className="text-sm text-muted-foreground">or type below</span>
        </div>
      )}

      {speechConsented && !voice.isSupported && (
        <p className="text-sm text-muted-foreground">
          Speaking isn&apos;t supported in this browser — please type instead.
        </p>
      )}

      {voice.error && !canDictate && voice.isSupported && (
        <StatusMessage variant="warning">
          {voice.error.message} You can type below.
        </StatusMessage>
      )}

      <Textarea
        aria-labelledby={labelId}
        aria-describedby={describedById}
        rows={rows}
        placeholder={active ? "Your words will appear here…" : placeholder}
        value={value}
        maxLength={maxLength}
        required={required}
        onChange={(event) => onChange(event.target.value, "typed")}
      />

      {voice.interimTranscript && (
        <p aria-live="polite" className="text-sm text-muted-foreground italic">
          {voice.interimTranscript}
        </p>
      )}
    </div>
  );
}
