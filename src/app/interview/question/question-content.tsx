"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { QuestionContainer } from "@/components/interview/question-container";
import { NavigationControls } from "@/components/interview/navigation-controls";
import { VoiceButton } from "@/components/interview/voice-button";
import { Textarea } from "@/components/ui/textarea";
import { requireQuestion } from "@/config/interview";
import { useVoiceDemoState } from "@/features/voice/useVoiceDemoState";

const question = requireQuestion("demo-data-quality", "long_text");

export function QuestionContent() {
  const router = useRouter();
  const [answer, setAnswer] = useState("");
  const labelId = useId();
  const voice = useVoiceDemoState({
    onCapture: (transcript) => setAnswer(transcript),
  });

  return (
    <QuestionContainer section={question.section} question={question.question}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span id={labelId} className="sr-only">
            {question.question}
          </span>
          {question.voiceEnabled && (
            <VoiceButton
              status={voice.status}
              elapsedSeconds={voice.elapsedSeconds}
              onStart={voice.start}
              onStop={voice.stop}
            />
          )}
        </div>
        <Textarea
          aria-labelledby={labelId}
          placeholder="Type your answer…"
          rows={5}
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
        />
      </div>

      <NavigationControls
        onBack={() => router.push("/interview/section-transition")}
        onSkip={
          question.required
            ? undefined
            : () => router.push("/interview/question-choice")
        }
        onContinue={() => router.push("/interview/question-choice")}
        continueDisabled={question.required && answer.trim().length === 0}
      />
    </QuestionContainer>
  );
}
