import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SessionNotes } from "@/app/admin/(protected)/sessions/[id]/session-notes";
import { WithdrawSession } from "@/app/admin/(protected)/sessions/[id]/withdraw-session";
import { RETENTION_MONTHS } from "@/features/consent/content";
import { formatAnswer } from "@/features/interview/format-answer";
import { getSessionDetail } from "@/features/admin/queries";

export const metadata: Metadata = { title: "Session" };
export const dynamic = "force-dynamic";

export default async function SessionDetailPage({
  params,
}: PageProps<"/admin/sessions/[id]">) {
  const { id } = await params;
  const session = await getSessionDetail(id);
  if (!session) notFound();

  const consentRows: Array<[string, string]> = session.consent
    ? [
        ["Consent version", session.consent.version],
        [
          "Participation",
          session.consent.participationConsent ? "Given" : "Not given",
        ],
        [
          "Recording",
          session.consent.recordingConsent === null
            ? "Not asked"
            : session.consent.recordingConsent
              ? "Given"
              : "Declined",
        ],
        [
          "Consented at",
          new Date(session.consent.consentedAt).toLocaleString(),
        ],
        [
          "Withdrawn",
          session.consent.withdrawnAt
            ? new Date(session.consent.withdrawnAt).toLocaleString()
            : "No",
        ],
      ]
    : [["Consent", "No consent record"]];

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <Link
          href="/admin"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← All sessions
        </Link>
        <h1 className="text-xl font-medium">{session.participantCode}</h1>
        <p className="text-sm text-muted-foreground">
          {session.responseMode === "live_interview"
            ? "Live interview"
            : "Async form"}{" "}
          · {session.status} · questionnaire {session.questionnaireVersion}
        </p>
      </div>

      <section aria-labelledby="meta-heading" className="flex flex-col gap-3">
        <h2 id="meta-heading" className="text-sm font-medium">
          Session and consent
        </h2>
        <dl className="grid gap-x-6 gap-y-2 rounded-lg border p-4 text-sm sm:grid-cols-2">
          <Row
            label="Started"
            value={new Date(session.startedAt).toLocaleString()}
          />
          <Row
            label="Last activity"
            value={new Date(session.lastActivityAt).toLocaleString()}
          />
          <Row
            label={`Delete by (${RETENTION_MONTHS} months)`}
            value={new Date(
              new Date(session.startedAt).setMonth(
                new Date(session.startedAt).getMonth() + RETENTION_MONTHS
              )
            ).toLocaleDateString()}
          />
          <Row
            label="Completed"
            value={
              session.completedAt
                ? new Date(session.completedAt).toLocaleString()
                : "Not completed"
            }
          />
          {consentRows.map(([label, value]) => (
            <Row key={label} label={label} value={value} />
          ))}
        </dl>
      </section>

      <SessionNotes sessionId={session.id} notes={session.researcherNotes} />

      <WithdrawSession
        sessionId={session.id}
        participantCode={session.participantCode}
        alreadyWithdrawn={
          session.status === "withdrawn" ||
          session.consent?.withdrawnAt !== null
        }
      />

      <section
        aria-labelledby="responses-heading"
        className="flex flex-col gap-4"
      >
        <h2 id="responses-heading" className="text-sm font-medium">
          Responses by construct
        </h2>
        {session.responsesByConstruct.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No responses recorded yet.
          </p>
        )}
        {session.responsesByConstruct.map((group) => (
          <div key={group.construct} className="flex flex-col gap-2">
            <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {group.construct}
            </h3>
            <ul className="flex flex-col gap-3">
              {group.responses.map((response) => (
                <li
                  key={response.questionKey}
                  className="rounded-lg border p-4"
                >
                  <p className="text-sm font-medium">
                    {response.question?.prompt ?? response.questionKey}
                  </p>
                  <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">
                    {response.question
                      ? formatAnswer(response.question, {
                          questionId: response.questionKey,
                          value: response.value,
                          skipped: response.skipped,
                          method: "typed",
                          updatedAt: response.updatedAt,
                        })
                      : JSON.stringify(response.value)}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {response.method} ·{" "}
                    {new Date(response.updatedAt).toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 sm:justify-start">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-right sm:ml-auto sm:text-left">{value}</dd>
    </div>
  );
}
