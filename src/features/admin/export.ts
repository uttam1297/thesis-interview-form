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
  storage_generation: "v1" | "v2";
  participant_code: string;
  response_mode: Database["public"]["Enums"]["response_mode"];
  session_status: Database["public"]["Enums"]["session_status"];
  questionnaire_version: string;
  study_stage: "not_recorded" | "pilot_v2" | "formal_v2";
  role: string | null;
  industry: string | null;
  question_id: string;
  construct: string;
  constructs: string[];
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

  const legacyCollected: unknown[] = [];
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
    legacyCollected.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  const legacyRows = legacyCollected as unknown as Array<{
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

  const v2Collected: unknown[] = [];
  for (let page = 0; ; page += 1) {
    const { data, error } = await supabase
      .from("interview_v2_responses")
      .select(
        `question_id, constructs, response_type, response_value, skipped,
         method, created_at,
         interview_v2_sessions ( participant_code, response_mode, status,
           questionnaire_version, study_stage ),
         interview_v2_questions ( definition, position )`
      )
      .order("created_at", { ascending: true })
      .order("question_id", { ascending: true })
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error) throw new Error(`V2 export query failed: ${error.message}`);
    v2Collected.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  const v2Rows = v2Collected as Array<{
    question_id: string;
    constructs: string[];
    response_type: string;
    response_value: unknown;
    skipped: boolean;
    method: string;
    created_at: string;
    interview_v2_sessions: {
      participant_code: string;
      response_mode: Database["public"]["Enums"]["response_mode"];
      status: Database["public"]["Enums"]["session_status"];
      questionnaire_version: string;
      study_stage: "pilot_v2" | "formal_v2";
    };
    interview_v2_questions: { definition: unknown; position: number } | null;
  }>;

  const withoutProfiles: Array<Omit<ExportRow, "role" | "industry">> = [
    ...legacyRows.map((row) => {
      const question = row.questionnaire_questions
        ?.definition as InterviewQuestion | null;
      return {
        storage_generation: "v1" as const,
        participant_code: row.sessions.participants.participant_code,
        response_mode: row.sessions.response_mode,
        session_status: row.sessions.status,
        questionnaire_version: row.sessions.questionnaire_versions.version,
        study_stage: "not_recorded" as const,
        question_id: row.question_key,
        construct: row.construct,
        constructs: [row.construct],
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
    }),
    ...v2Rows.map((row) => {
      const question = row.interview_v2_questions
        ?.definition as InterviewQuestion | null;
      return {
        storage_generation: "v2" as const,
        participant_code: row.interview_v2_sessions.participant_code,
        response_mode: row.interview_v2_sessions.response_mode,
        session_status: row.interview_v2_sessions.status,
        questionnaire_version: row.interview_v2_sessions.questionnaire_version,
        study_stage: row.interview_v2_sessions.study_stage,
        question_id: row.question_id,
        construct: row.constructs[0] ?? "unclassified",
        constructs: row.constructs,
        response_type: row.response_type,
        response: renderAnswer(
          question,
          row.response_value as ResponseValue | null,
          row.skipped
        ),
        skipped: row.skipped,
        method: row.method,
        recorded_at: row.created_at,
        raw: (row.response_value as ResponseValue | null) ?? null,
        prompt: question?.prompt ?? row.question_id,
      };
    }),
  ];

  // Role and industry are repeated on every row so the CSV can be filtered
  // and grouped without a join.
  const profileByParticipant = new Map<
    string,
    { role?: string; industry?: string }
  >();
  for (const row of withoutProfiles) {
    const key = `${row.storage_generation}:${row.participant_code}`;
    if (
      row.question_id === "profile-role" ||
      row.question_id === "profile-industry" ||
      row.question_id === "v2_profile_role" ||
      row.question_id === "v2_profile_industry"
    ) {
      const entry = profileByParticipant.get(key) ?? {};
      if (row.question_id.endsWith("role")) entry.role = row.response;
      else entry.industry = row.response;
      profileByParticipant.set(key, entry);
    }
  }

  return withoutProfiles
    .map((row) => {
      const key = `${row.storage_generation}:${row.participant_code}`;
      const profile = profileByParticipant.get(key) ?? {};
      return {
        ...row,
        role: profile.role ?? null,
        industry: profile.industry ?? null,
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
      const sessionKey = `${row.storage_generation}:${row.participant_code}`;
      const existing = bySession.get(sessionKey) ?? {
        storage_generation: row.storage_generation,
        participant_code: row.participant_code,
        response_mode: row.response_mode,
        session_status: row.session_status,
        questionnaire_version: row.questionnaire_version,
        study_stage: row.study_stage,
        responses: [] as unknown[],
      };
      (existing.responses as unknown[]).push({
        question_id: row.question_id,
        prompt: row.prompt,
        construct: row.construct,
        constructs: row.constructs,
        response_type: row.response_type,
        value: row.raw,
        rendered: row.response,
        skipped: row.skipped,
        method: row.method,
        recorded_at: row.recorded_at,
      });
      bySession.set(sessionKey, existing);
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
        [
          "participant",
          "questionnaire_version",
          "study_stage",
          "question_id",
          "construct",
          "constructs",
          "question",
          "response",
          "collection_mode",
        ],
        rows.map((row) => [
          row.participant_code,
          row.questionnaire_version,
          row.study_stage,
          row.question_id,
          row.construct,
          row.constructs.join(" | "),
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
        "storage_generation",
        "questionnaire_version",
        "study_stage",
        "response_mode",
        "session_status",
        "role",
        "industry",
        "question_id",
        "construct",
        "constructs",
        "response_type",
        "response",
        "skipped",
        "method",
        "recorded_at",
      ],
      rows.map((row) => [
        row.participant_code,
        row.storage_generation,
        row.questionnaire_version,
        row.study_stage,
        row.response_mode,
        row.session_status,
        row.role,
        row.industry,
        row.question_id,
        row.construct,
        row.constructs.join(" | "),
        row.response_type,
        row.response,
        row.skipped,
        row.method,
        row.recorded_at,
      ])
    ),
    contentType: "text/csv; charset=utf-8",
    filename: `interview-responses-${stamp}.csv`,
  };
}
