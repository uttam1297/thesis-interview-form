import "server-only";

import { toCsv } from "@/features/admin/csv";
import { formatAnswer } from "@/features/interview/format-answer";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { InterviewQuestion, ResponseValue } from "@/types/interview";

/**
 * Research exports. Deliberately excludes internal identifiers, resume
 * tokens and researcher account ids: only what analysis needs.
 */

export type ExportFormat = "csv" | "json" | "long";

interface ExportRow {
  participant_code: string;
  response_mode: Database["public"]["Enums"]["response_mode"];
  session_status: Database["public"]["Enums"]["session_status"];
  questionnaire_version: string;
  role: string | null;
  industry: string | null;
  question_id: string;
  construct: string;
  response_type: string;
  response: string;
  skipped: boolean;
  method: string;
  recorded_at: string;
  raw: ResponseValue | null;
  prompt: string;
}

function renderAnswer(
  question: InterviewQuestion | null,
  value: ResponseValue | null,
  skipped: boolean
): string {
  if (skipped) return "Skipped";
  if (!question) {
    if (!value) return "";
    return value.kind === "text" ? value.text : JSON.stringify(value);
  }
  return formatAnswer(question, {
    questionId: question.id,
    value,
    skipped,
    method: "typed",
    updatedAt: "",
  });
}

/**
 * Supabase caps a single request at 1000 rows, so the export pages through
 * the table. Without this, a study large enough to matter would silently
 * lose responses from its export — the worst possible failure for research
 * data, because nothing looks wrong.
 */
const PAGE_SIZE = 1000;

async function loadRows(): Promise<ExportRow[]> {
  const supabase = await createServerSupabaseClient();

  const collected: unknown[] = [];
  for (let page = 0; ; page += 1) {
    const { data, error } = await supabase
      .from("responses")
      .select(
        `question_key, construct, response_type, value, skipped, method, recorded_at,
       sessions ( response_mode, status, started_at,
                  participants ( participant_code ),
                  questionnaire_versions ( version ) ),
       questionnaire_questions ( definition, position )`
      )
      // Paging is only complete over a stable order.
      .order("recorded_at", { ascending: true })
      .order("question_key", { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

    if (error) throw new Error(`Export query failed: ${error.message}`);
    collected.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  const rows = collected as unknown as Array<{
    question_key: string;
    construct: string;
    response_type: string;
    value: unknown;
    skipped: boolean;
    method: string;
    recorded_at: string;
    sessions: {
      response_mode: Database["public"]["Enums"]["response_mode"];
      status: Database["public"]["Enums"]["session_status"];
      participants: { participant_code: string };
      questionnaire_versions: { version: string };
    };
    questionnaire_questions: { definition: unknown; position: number } | null;
  }>;

  // Role and industry are repeated on every row so the CSV can be filtered
  // and grouped without a join.
  const profileByParticipant = new Map<
    string,
    { role?: string; industry?: string }
  >();
  for (const row of rows) {
    const code = row.sessions.participants.participant_code;
    const question = row.questionnaire_questions
      ?.definition as InterviewQuestion | null;
    const answer = renderAnswer(
      question,
      row.value as ResponseValue | null,
      row.skipped
    );
    if (
      row.question_key === "profile-role" ||
      row.question_key === "profile-industry"
    ) {
      const entry = profileByParticipant.get(code) ?? {};
      if (row.question_key === "profile-role") entry.role = answer;
      else entry.industry = answer;
      profileByParticipant.set(code, entry);
    }
  }

  return rows
    .map((row) => {
      const question = row.questionnaire_questions
        ?.definition as InterviewQuestion | null;
      const code = row.sessions.participants.participant_code;
      const profile = profileByParticipant.get(code) ?? {};
      return {
        participant_code: code,
        response_mode: row.sessions.response_mode,
        session_status: row.sessions.status,
        questionnaire_version: row.sessions.questionnaire_versions.version,
        role: profile.role ?? null,
        industry: profile.industry ?? null,
        question_id: row.question_key,
        construct: row.construct,
        response_type: row.response_type,
        response: renderAnswer(
          question,
          row.value as ResponseValue | null,
          row.skipped
        ),
        skipped: row.skipped,
        method: row.method,
        recorded_at: row.recorded_at,
        raw: (row.value as ResponseValue | null) ?? null,
        prompt: question?.prompt ?? row.question_key,
      };
    })
    .sort(
      (a, b) =>
        a.participant_code.localeCompare(b.participant_code) ||
        a.question_id.localeCompare(b.question_id)
    );
}

export async function buildExport(
  format: ExportFormat
): Promise<{ body: string; contentType: string; filename: string }> {
  const rows = await loadRows();
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    const bySession = new Map<string, Record<string, unknown>>();
    for (const row of rows) {
      const existing = bySession.get(row.participant_code) ?? {
        participant_code: row.participant_code,
        response_mode: row.response_mode,
        session_status: row.session_status,
        questionnaire_version: row.questionnaire_version,
        responses: [] as unknown[],
      };
      (existing.responses as unknown[]).push({
        question_id: row.question_id,
        prompt: row.prompt,
        construct: row.construct,
        response_type: row.response_type,
        value: row.raw,
        rendered: row.response,
        skipped: row.skipped,
        method: row.method,
        recorded_at: row.recorded_at,
      });
      bySession.set(row.participant_code, existing);
    }
    return {
      body: JSON.stringify(
        {
          exported_at: new Date().toISOString(),
          participants: [...bySession.values()],
        },
        null,
        2
      ),
      contentType: "application/json; charset=utf-8",
      filename: `interview-responses-${stamp}.json`,
    };
  }

  if (format === "long") {
    // Qualitative coding format: one row per answer, minimal columns.
    return {
      body: toCsv(
        ["participant", "construct", "question", "response", "collection_mode"],
        rows.map((row) => [
          row.participant_code,
          row.construct,
          row.prompt,
          row.response,
          row.response_mode,
        ])
      ),
      contentType: "text/csv; charset=utf-8",
      filename: `interview-qualitative-${stamp}.csv`,
    };
  }

  return {
    body: toCsv(
      [
        "participant_code",
        "response_mode",
        "session_status",
        "role",
        "industry",
        "question_id",
        "construct",
        "response_type",
        "response",
        "skipped",
        "method",
        "questionnaire_version",
        "recorded_at",
      ],
      rows.map((row) => [
        row.participant_code,
        row.response_mode,
        row.session_status,
        row.role,
        row.industry,
        row.question_id,
        row.construct,
        row.response_type,
        row.response,
        row.skipped,
        row.method,
        row.questionnaire_version,
        row.recorded_at,
      ])
    ),
    contentType: "text/csv; charset=utf-8",
    filename: `interview-responses-${stamp}.csv`,
  };
}
