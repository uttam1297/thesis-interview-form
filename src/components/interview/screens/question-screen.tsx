"use client";

import { useId, useState } from "react";

import { StatusMessage } from "@/components/feedback/status-message";
import { AnswerConstellation } from "@/components/interview/answer-constellation";
import { NavigationControls } from "@/components/interview/navigation-controls";
import { ResponseRenderer } from "@/components/interview/responses/registry";
import { ScreenHeading } from "@/components/interview/screen-heading";
import { SectionHeader } from "@/components/interview/section-header";
import type { Step } from "@/features/interview/steps";
import { useInterview } from "@/features/interview/use-interview";
import {
  isRecordComplete,
  validateResponse,
} from "@/features/interview/validate-response";
import { visibleQuestionSteps } from "@/features/interview/steps";
import type { ResponseMethod, ResponseValue } from "@/types/interview";

interface QuestionScreenProps {
  step: Extract<Step, { kind: "question" }>;
}

export function QuestionScreen({ step }: QuestionScreenProps) {
  const { question, section } = step;
  const { state, dispatch, steps } = useInterview();
  const [error, setError] = useState<string | null>(null);
  const labelId = useId();
  const descriptionId = useId();
  const guidanceId = useId();
  const errorId = useId();

  const isOpenQuestion =
    question.responseType === "voice_or_text" ||
    question.responseType === "long_text" ||
    question.responseType === "optional_elaboration";

  const record = state.responses[question.id];
  const value = record?.value ?? null;

  // The constellation spans the whole interview rather than resetting each
  // section, so it keeps accumulating from the first question to the last.
  const allQuestions = visibleQuestionSteps(steps);
  const currentIndex = allQuestions.findIndex(
    (s) => s.question.id === question.id
  );
  const answeredCount = allQuestions.filter((s) =>
    isRecordComplete(s.question, state.responses[s.question.id])
  ).length;

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
    <div className="grid w-full justify-items-center gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:justify-items-stretch lg:gap-14">
      <div className="flex w-full max-w-(--width-content-narrow) flex-col gap-6">
        <div className="flex flex-col gap-2">
          <SectionHeader section={section.label} />
          <ScreenHeading id={labelId}>{question.prompt}</ScreenHeading>
          {question.description && (
            <p id={descriptionId} className="text-sm text-muted-foreground">
              {question.description}
            </p>
          )}
          {/*
          Guidance only — never implies a long answer is expected. This is
          supporting copy and does not alter the research question itself.
        */}
          {isOpenQuestion && (
            <p id={guidanceId} className="text-sm text-muted-foreground">
              A sentence or two is plenty. Answer in your own words.
            </p>
          )}
          {!question.required && (
            <p className="text-xs text-muted-foreground">
              Optional — you can skip this.
            </p>
          )}
        </div>

        <ResponseRenderer
          question={question}
          value={value}
          onChange={handleChange}
          labelId={labelId}
          speechConsented={state.consent?.recordingConsent === true}
          // Description, guidance and any validation error are all announced
          // with the control they belong to.
          describedById={
            [
              question.description ? descriptionId : null,
              isOpenQuestion ? guidanceId : null,
              error ? errorId : null,
            ]
              .filter(Boolean)
              .join(" ") || undefined
          }
        />

        {error && (
          <div id={errorId}>
            <StatusMessage variant="warning">{error}</StatusMessage>
          </div>
        )}

        <NavigationControls
          onBack={() => dispatch({ type: "BACK" })}
          onSkip={question.required ? undefined : handleSkip}
          onContinue={handleContinue}
          continueLabel={
            state.returnToReview ? "Save and return to review" : "Continue"
          }
        />
      </div>

      {/* Hidden on small screens: a question should never be pushed down the
          page by a picture. */}
      <aside className="order-last hidden w-full lg:order-none lg:block lg:w-auto">
        <div className="rounded-2xl border bg-card p-8 shadow-(--shadow-subtle)">
          <AnswerConstellation
            total={allQuestions.length}
            answered={answeredCount}
            currentIndex={Math.max(currentIndex, 0)}
            className="h-56 w-64 text-foreground"
          />
          <p className="mt-4 max-w-64 text-sm text-muted-foreground">
            {question.aside ??
              `${answeredCount} of ${allQuestions.length} answered so far.`}
          </p>
        </div>
      </aside>
    </div>
  );
}
