import type { Metadata } from "next";

import { getQuestionHealth, listSessions } from "@/features/admin/queries";

export const metadata: Metadata = { title: "Pilot" };
export const dynamic = "force-dynamic";

/**
 * Signals for running a small pilot: how long completion actually takes,
 * which questions get skipped, and where unfinished sessions stop. All of
 * it is derived from data already collected — no behavioural tracking.
 */
export default async function PilotPage() {
  const [sessions, questions] = await Promise.all([
    listSessions(),
    getQuestionHealth(),
  ]);

  const durations = sessions
    .map((s) => s.durationMinutes)
    .filter((d): d is number => d !== null)
    .sort((a, b) => a - b);
  const median =
    durations.length > 0 ? durations[Math.floor(durations.length / 2)] : null;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-medium">Pilot signals</h1>
        <p className="text-sm text-muted-foreground">
          Use these to judge length and clarity before inviting real
          participants.
        </p>
      </div>

      <section
        aria-labelledby="duration-heading"
        className="flex flex-col gap-3"
      >
        <h2 id="duration-heading" className="text-sm font-medium">
          Completion time
        </h2>
        {median === null ? (
          <p className="text-sm text-muted-foreground">
            No completed sessions yet, so there is no grounded duration estimate
            to show participants.
          </p>
        ) : (
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Tile label="Completed" value={String(durations.length)} />
            <Tile label="Median" value={`${median} min`} />
            <Tile label="Fastest" value={`${durations[0]} min`} />
            <Tile label="Slowest" value={`${durations.at(-1)} min`} />
          </dl>
        )}
      </section>

      <section
        aria-labelledby="questions-heading"
        className="flex flex-col gap-3"
      >
        <h2 id="questions-heading" className="text-sm font-medium">
          Question health
        </h2>
        <p className="text-sm text-muted-foreground">
          A question skipped unusually often, or where several sessions stop, is
          worth rewording before the real study.
        </p>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-3 py-2 font-medium">Question</th>
                <th className="px-3 py-2 font-medium">Construct</th>
                <th className="px-3 py-2 font-medium">Answered</th>
                <th className="px-3 py-2 font-medium">Skipped</th>
                <th className="px-3 py-2 font-medium">Stopped here</th>
              </tr>
            </thead>
            <tbody>
              {questions.map((question) => (
                <tr key={question.questionKey} className="border-t">
                  <td className="max-w-md px-3 py-2">{question.prompt}</td>
                  <td className="px-3 py-2 text-muted-foreground">
                    {question.construct || "—"}
                  </td>
                  <td className="px-3 py-2 tabular-nums">
                    {question.answered}
                  </td>
                  <td className="px-3 py-2 tabular-nums">{question.skipped}</td>
                  <td className="px-3 py-2 tabular-nums">
                    {question.lastSeen}
                  </td>
                </tr>
              ))}
              {questions.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-3 py-6 text-center text-muted-foreground"
                  >
                    No responses recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-4">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-2xl font-medium tabular-nums">{value}</dd>
    </div>
  );
}
