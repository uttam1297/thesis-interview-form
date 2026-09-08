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
  const isListening = voice.status === "listening";

  return (
    <div className="flex flex-col gap-3">
      {voice.isSupported ? (
        <div className="flex flex-wrap items-center gap-3">
          <VoiceButton
            status={isListening ? "listening" : "idle"}
            elapsedSeconds={voice.elapsedSeconds}
            onStart={voice.start}
            onStop={voice.stop}
          />
          <span className="text-sm text-muted-foreground">or type below</span>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Voice input isn&apos;t available in this browser — please type your
          answer.
        </p>
      )}

      {voice.error && voice.status === "error" && (
        <StatusMessage variant="warning">{voice.error.message}</StatusMessage>
      )}

      <Textarea
        aria-labelledby={labelId}
        aria-describedby={describedById}
        rows={6}
        placeholder={
          isListening
            ? "Listening… your words will appear here."
            : "Type your answer…"
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
