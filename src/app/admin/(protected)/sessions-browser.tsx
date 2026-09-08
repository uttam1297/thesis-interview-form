"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { SessionListItem } from "@/features/admin/queries";

const statusLabels: Record<string, string> = {
  in_progress: "In progress",
  completed: "Completed",
  inactive: "Inactive",
  abandoned: "Abandoned",
  withdrawn: "Withdrawn",
};

/** Session list with client-side filtering and the export actions. */
export function SessionsBrowser({ sessions }: { sessions: SessionListItem[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [mode, setMode] = useState("all");
  const [version, setVersion] = useState("all");

  const versions = useMemo(
    () => [...new Set(sessions.map((s) => s.questionnaireVersion))].sort(),
    [sessions]
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return sessions.filter((session) => {
      if (status !== "all" && session.derivedStatus !== status) return false;
      if (mode !== "all" && session.responseMode !== mode) return false;
      if (version !== "all" && session.questionnaireVersion !== version)
        return false;
      if (!needle) return true;
      return [session.participantCode, session.role, session.industry]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(needle));
    });
  }, [sessions, query, status, mode, version]);

  return (
    <section className="flex flex-col gap-4" aria-label="Sessions">
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-xs text-muted-foreground">
          Search
          <Input
            className="w-56"
            placeholder="Participant, role, industry"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>

        <FilterSelect
          label="Status"
          value={status}
          onChange={setStatus}
          options={[
            ["all", "All"],
            ["in_progress", "In progress"],
            ["completed", "Completed"],
            ["inactive", "Inactive"],
          ]}
        />
        <FilterSelect
          label="Mode"
          value={mode}
          onChange={setMode}
          options={[
            ["all", "All"],
            ["asynchronous_form", "Form"],
            ["live_interview", "Live"],
          ]}
        />
        <FilterSelect
          label="Version"
          value={version}
          onChange={setVersion}
          options={[
            ["all", "All"],
            ...versions.map((v) => [v, v] as [string, string]),
          ]}
        />

        <div className="ml-auto flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            render={<a href="/api/admin/export?format=csv" />}
          >
            CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<a href="/api/admin/export?format=json" />}
          >
            JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            render={<a href="/api/admin/export?format=long" />}
          >
            Qualitative CSV
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Participant</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Mode</th>
              <th className="px-3 py-2 font-medium">Role</th>
              <th className="px-3 py-2 font-medium">Industry</th>
              <th className="px-3 py-2 font-medium">Answers</th>
              <th className="px-3 py-2 font-medium">Duration</th>
              <th className="px-3 py-2 font-medium">Version</th>
              <th className="px-3 py-2 font-medium">Last activity</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((session) => (
              <tr key={session.id} className="border-t">
                <td className="px-3 py-2">
                  <Link
                    href={`/admin/sessions/${session.id}`}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {session.participantCode}
                  </Link>
                </td>
                <td className="px-3 py-2">
                  {statusLabels[session.derivedStatus] ?? session.derivedStatus}
                </td>
                <td className="px-3 py-2">
                  {session.responseMode === "live_interview" ? "Live" : "Form"}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {session.role ?? "—"}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {session.industry ?? "—"}
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {session.answeredCount}
                </td>
                <td className="px-3 py-2 tabular-nums text-muted-foreground">
                  {session.durationMinutes === null
                    ? "—"
                    : `${session.durationMinutes} min`}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {session.questionnaireVersion}
                </td>
                <td className="px-3 py-2 text-muted-foreground">
                  {new Date(session.lastActivityAt).toLocaleString()}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={9}
                  className="px-3 py-6 text-center text-muted-foreground"
                >
                  No sessions match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs text-muted-foreground">
      {label}
      <select
        className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}
