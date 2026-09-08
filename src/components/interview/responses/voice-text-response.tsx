"use client";

import { useCallback } from "react";

import { StatusMessage } from "@/components/feedback/status-message";
import type { ResponseComponentProps } from "@/components/interview/responses/types";
import { VoiceButton } from "@/components/interview/voice-button";
import { Textarea } from "@/components/ui/textarea";
import { useVoiceInput } from "@/features/voice/use-voice-input";
import { useSpeechAdapter } from "@/features/voice/voice-adapter-context";

type VoiceCapableType = "voice_or_text" | "optional_elaboration";

/**
 * Open answer with optional dictation. Speech is appended into the same
 * editable textarea, so the transcript the participant sees is the answer
 * that gets saved — there is no separate confirmation step.
 *
 * The textarea is always present and always usable: if dictation is
 * unsupported, refused or fails, the participant is never blocked.
 */
export function VoiceTextResponse({
  question,
  value,
  onChange,
  labelId,
  describedById,
}: ResponseComponentProps<VoiceCapableType>) {
  const text = value?.kind === "text" ? value.text : "";
  const adapter = useSpeechAdapter();

  const appendTranscript = useCallback(
    (phrase: string) => {
      if (!phrase) return;
      const current = value?.kind === "text" ? value.text : "";
      const separator = current.length === 0 || /\s$/.test(current) ? "" : " ";
      onChange(
        { kind: "text", text: `${current}${separator}${phrase}` },
        "voice"
      );
    },
    [value, onChange]
  );

  const voice = useVoiceInput({ adapter, onFinalTranscript: appendTranscript });
  const isActive =
    voice.status === "listening" || voice.status === "requesting";
  // Once refused, offering the button again just fails silently.
  const canDictate =
    voice.isSupported && voice.status !== "denied" && voice.status !== "error";

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
          <span className="text-sm text-muted-foreground">
            or type your answer below
          </span>
        </div>
      )}

      {!voice.isSupported && (
        <p className="text-sm text-muted-foreground">
          Speaking your answer isn&apos;t supported in this browser — please
          type instead.
        </p>
      )}

      {voice.error && !canDictate && voice.isSupported && (
        <StatusMessage variant="warning">
          {voice.error.message} You can type your answer below.
        </StatusMessage>
      )}

      <Textarea
        aria-labelledby={labelId}
        aria-describedby={describedById}
        rows={6}
        placeholder={
          isActive ? "Your words will appear here…" : "Type your answer…"
        }
        value={text}
        maxLength={question.validation?.maxLength}
        onChange={(event) =>
          onChange({ kind: "text", text: event.target.value }, "typed")
        }
      />

      {voice.interimTranscript && (
        <p aria-live="polite" className="text-sm text-muted-foreground italic">
          {voice.interimTranscript}
        </p>
      )}
    </div>
  );
}
