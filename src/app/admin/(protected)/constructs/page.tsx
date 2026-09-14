import type { Metadata } from "next";

import { listResponsesByConstruct } from "@/features/admin/queries";
import { formatAnswer } from "@/features/interview/format-answer";
import type { InterviewQuestion, ResponseValue } from "@/types/interview";

export const metadata: Metadata = { title: "Responses by construct" };
export const dynamic = "force-dynamic";

/** Renders an answer without needing the full question definition. */
function renderValue(value: ResponseValue | null, skipped: boolean): string {
  if (skipped) return "Skipped";
  if (!value) return "Not answered";
  switch (value.kind) {
    case "text":
      return value.text;
    case "single":
      return value.other?.trim() || value.value;
    case "multi":
      return [...value.values, value.other].filter(Boolean).join(", ");
    case "scale":
      return String(value.value);
    case "ranking":
      return value.order
        .map((item, index) => `${index + 1}. ${item}`)
        .join(" · ");
    case "guided_text":
      return [value.nonAnswer ?? value.text, value.optionalElaboration]
        .filter(Boolean)
        .join(" · ");
    case "multi_elaboration":
      return [value.values.join(", "), value.other, value.optionalElaboration]
        .filter(Boolean)
        .join(" · ");
  }
}

function renderResponse(
  question: InterviewQuestion | null,
  questionId: string,
  value: ResponseValue | null,
  skipped: boolean,
  recordedAt: string
): string {
  if (!question) return renderValue(value, skipped);
  return formatAnswer(question, {
    questionId,
    value,
    skipped,
    method: "typed",
    updatedAt: recordedAt,
  });
}

export default async function ConstructsPage() {
  const groups = await listResponsesByConstruct();

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-medium">Responses by construct</h1>
        <p className="text-sm text-muted-foreground">
          Every participant&apos;s answers side by side, for qualitative coding.
        </p>
      </div>

      {groups.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No responses recorded yet.
        </p>
      )}

      {groups.map((group) => (
        <section
          key={`${group.storageGeneration}-${group.construct}`}
          className="flex flex-col gap-3"
        >
          <h2 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {group.storageGeneration.toUpperCase()} · {group.construct}
          </h2>
          <ul className="flex flex-col gap-3">
            {group.responses.map((response, index) => (
              <li
                key={`${response.participantCode}-${response.questionKey}-${index}`}
                className="rounded-lg border p-4"
              >
                <div className="flex flex-wrap items-baseline gap-2">
                  <span className="text-sm font-medium">
                    {response.participantCode}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {response.studyStage === "not_recorded"
                      ? "Stage not recorded"
                      : response.studyStage}{" "}
                    ·{" "}
                    {response.responseMode === "live_interview"
                      ? "Live"
                      : "Form"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {response.prompt}
                </p>
                <p className="mt-2 text-sm whitespace-pre-line">
                  {renderResponse(
                    response.question,
                    response.questionKey,
                    response.value,
                    response.skipped,
                    response.recordedAt
                  )}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
