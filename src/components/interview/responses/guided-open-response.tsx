"use client";

import { useId } from "react";

import { DictatableField } from "@/components/interview/responses/dictatable-field";
import type { ResponseComponentProps } from "@/components/interview/responses/types";
import { SingleSelectGroup } from "@/components/interview/single-select-group";
import { evaluateCondition } from "@/features/interview/conditions";
import { hasMeaningfulOpenText } from "@/features/interview/validate-response";

export function GuidedOpenResponse({
  question,
  value,
  onChange,
  labelId,
  describedById,
  speechConsented = false,
  responses = {},
}: ResponseComponentProps<"guided_open">) {
  const probeLabelId = useId();
  const current =
    value?.kind === "guided_text"
      ? value
      : { kind: "guided_text" as const, text: "" };
  const substantive = hasMeaningfulOpenText(current.text) && !current.nonAnswer;
  const conditionsHold =
    !question.optionalProbe?.showIf ||
    question.optionalProbe.showIf.every((condition) =>
      evaluateCondition(condition, responses)
    );
  const showProbe =
    Boolean(question.optionalProbe) &&
    conditionsHold &&
    (!question.optionalProbe?.requireSubstantiveAnswer || substantive);

  return (
    <div className="flex flex-col gap-5">
      <DictatableField
        value={current.text}
        onChange={(text, method) =>
          onChange(
            {
              ...current,
              text,
              nonAnswer: text.trim() ? undefined : current.nonAnswer,
            },
            method
          )
        }
        labelId={labelId}
        describedById={describedById}
        speechConsented={speechConsented}
        rows={5}
        maxLength={question.validation?.maxLength}
      />

      {question.nonAnswerOptions && (
        <div className="flex flex-col gap-2 border-t pt-4">
          <p className="text-sm text-muted-foreground">Or choose one:</p>
          <SingleSelectGroup
            name={`${question.id}-non-answer`}
            options={question.nonAnswerOptions}
            value={current.nonAnswer}
            onValueChange={(nonAnswer) =>
              onChange(
                {
                  kind: "guided_text",
                  text: "",
                  nonAnswer,
                  optionalElaboration: undefined,
                },
                "selected"
              )
            }
            aria-labelledby={labelId}
          />
        </div>
      )}

      {showProbe && question.optionalProbe && (
        <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-4">
          <p id={probeLabelId} className="text-sm font-medium">
            {question.optionalProbe.prompt}
          </p>
          <p className="text-xs text-muted-foreground">Optional</p>
          <DictatableField
            value={current.optionalElaboration ?? ""}
            onChange={(optionalElaboration, method) =>
              onChange({ ...current, optionalElaboration }, method)
            }
            labelId={probeLabelId}
            speechConsented={speechConsented}
            rows={3}
            placeholder="Add an optional answer…"
            maxLength={question.validation?.maxLength}
          />
        </div>
      )}
    </div>
  );
}
