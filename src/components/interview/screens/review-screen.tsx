"use client";

import { StatusMessage } from "@/components/feedback/status-message";
import { ScreenHeading } from "@/components/interview/screen-heading";
import { Button } from "@/components/ui/button";
import { formatAnswer } from "@/features/interview/format-answer";
import { visibleQuestionSteps } from "@/features/interview/steps";
import { useInterview } from "@/features/interview/use-interview";
import { isRecordComplete } from "@/features/interview/validate-response";

export function ReviewScreen() {
  const { config, state, steps, dispatch, submit, submitting, submitError } =
    useInterview();
  const questionSteps = visibleQuestionSteps(steps);

  const incomplete = questionSteps.filter(
    ({ question }) =>
      question.required &&
      !isRecordComplete(question, state.responses[question.id])
  );

  return (
    <div className="flex w-full max-w-(--width-content) flex-col gap-6">
      <div className="flex flex-col gap-2">
        <ScreenHeading>Review your answers</ScreenHeading>
        <p className="text-sm text-muted-foreground">
          Skim if you like — you can change anything before submitting.
        </p>
      </div>

      {incomplete.length > 0 && (
        <StatusMessage variant="warning">
          {incomplete.length === 1
            ? "One required question still needs an answer."
            : `${incomplete.length} required questions still need an answer.`}
        </StatusMessage>
      )}

      {config.sections.map((section) => {
        const items = questionSteps.filter((s) => s.section.id === section.id);
        if (items.length === 0) return null;
        return (
          <section key={section.id} aria-labelledby={`review-${section.id}`}>
            <h2
              id={`review-${section.id}`}
              className="mb-3 text-sm font-medium tracking-wide text-muted-foreground uppercase"
            >
              {section.label}
            </h2>
            <ul className="flex flex-col gap-3">
              {items.map(({ question }) => {
                const record = state.responses[question.id];
                const missing =
                  question.required && !isRecordComplete(question, record);
                return (
                  <li
                    key={question.id}
                    className="flex flex-col gap-1 rounded-lg border p-4 data-[missing=true]:border-destructive/40"
                    data-missing={missing}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-sm font-medium">{question.title}</p>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto shrink-0 p-0"
                        aria-label={`${missing ? "Answer" : "Edit"}: ${question.title}`}
                        onClick={() =>
                          dispatch({
                            type: "GO_TO_QUESTION",
                            questionId: question.id,
                            fromReview: true,
                          })
                        }
                      >
                        {missing ? "Answer" : "Edit"}
                      </Button>
                    </div>
                    <p className="text-sm whitespace-pre-line text-muted-foreground">
                      {formatAnswer(question, record)}
                    </p>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      {submitError && (
        <StatusMessage variant="warning">{submitError}</StatusMessage>
      )}

      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" onClick={() => dispatch({ type: "BACK" })}>
          Back
        </Button>
        <Button
          size="lg"
          disabled={submitting || incomplete.length > 0}
          onClick={() => void submit()}
        >
          {submitting ? "Submitting…" : "Submit"}
        </Button>
      </div>
    </div>
  );
}
