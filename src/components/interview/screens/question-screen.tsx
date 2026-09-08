"use client";

import { motion } from "motion/react";
import { useId, useState } from "react";

import { StatusMessage } from "@/components/feedback/status-message";
import { NavigationControls } from "@/components/interview/navigation-controls";
import { ResponseRenderer } from "@/components/interview/responses/registry";
import { ScreenHeading } from "@/components/interview/screen-heading";
import { SectionHeader } from "@/components/interview/section-header";
import type { Step } from "@/features/interview/steps";
import { useInterview } from "@/features/interview/use-interview";
import { validateResponse } from "@/features/interview/validate-response";
import { questionVariants, transitions } from "@/lib/motion";
import type { ResponseMethod, ResponseValue } from "@/types/interview";

interface QuestionScreenProps {
  step: Extract<Step, { kind: "question" }>;
}

export function QuestionScreen({ step }: QuestionScreenProps) {
  const { question, section } = step;
  const { state, dispatch } = useInterview();
  const [error, setError] = useState<string | null>(null);
  const labelId = useId();
  const descriptionId = useId();

  const record = state.responses[question.id];
  const value = record?.value ?? null;

  const handleChange = (next: ResponseValue | null, method: ResponseMethod) => {
    setError(null);
    dispatch({ type: "ANSWER", questionId: question.id, value: next, method });
  };

  const handleContinue = () => {
    const problem = validateResponse(question, value);
    if (problem) {
      setError(problem);
      return;
    }
    dispatch({ type: "NEXT" });
  };

  const handleSkip = () => {
    dispatch({ type: "SKIP", questionId: question.id });
    dispatch({ type: "NEXT" });
  };

  return (
    <motion.div
      key={question.id}
      variants={questionVariants}
      initial="enter"
      animate="center"
      transition={transitions.base}
      className="flex w-full max-w-(--width-content-narrow) flex-col gap-6"
    >
      <div className="flex flex-col gap-2">
        <SectionHeader section={section.label} />
        <ScreenHeading id={labelId}>{question.prompt}</ScreenHeading>
        {question.description && (
          <p id={descriptionId} className="text-sm text-muted-foreground">
            {question.description}
          </p>
        )}
        {!question.required && (
          <p className="text-xs text-muted-foreground">Optional</p>
        )}
      </div>

      <ResponseRenderer
        question={question}
        value={value}
        onChange={handleChange}
        labelId={labelId}
        describedById={question.description ? descriptionId : undefined}
      />

      {error && <StatusMessage variant="warning">{error}</StatusMessage>}

      <NavigationControls
        onBack={() => dispatch({ type: "BACK" })}
        onSkip={question.required ? undefined : handleSkip}
        onContinue={handleContinue}
        continueLabel={
          state.returnToReview ? "Save and return to review" : "Continue"
        }
      />
    </motion.div>
  );
}
