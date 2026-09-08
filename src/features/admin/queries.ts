import "server-only";

import { createServerSupabaseClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { InterviewQuestion, ResponseValue } from "@/types/interview";

/**
 * Read models for the researcher dashboard. Every query runs as the signed-in
 * researcher, so RLS is still the enforcing layer — these functions are for
 * shaping, not for access control.
 */

export type ResponseMode = Database["public"]["Enums"]["response_mode"];
export type SessionStatus = Database["public"]["Enums"]["session_status"];

/** Supabase returns at most 1000 rows per request. */
const RESPONSE_PAGE_SIZE = 1000;

/** A session with no activity for this long is treated as abandoned. */
const INACTIVITY_DAYS = 14;

export interface SessionListItem {
  id: string;
  participantCode: string;
  /** Minutes from start to submission; null while still in progress. */
  durationMinutes: number | null;
  responseMode: ResponseMode;
  status: SessionStatus;
  derivedStatus: SessionStatus | "inactive";
  questionnaireVersion: string;
  startedAt: string;
  lastActivityAt: string;
  completedAt: string | null;
  role: string | null;
  industry: string | null;
  answeredCount: number;
}

interface SessionRow {
  id: string;
  response_mode: ResponseMode;
  status: SessionStatus;
  started_at: string;
  last_activity_at: string;
  completed_at: string | null;
  participants: { participant_code: string };
  questionnaire_versions: { version: string };
  responses: Array<{
    question_key: string;
    value: unknown;
    skipped: boolean;
  }>;
}

function isInactive(row: {
  status: SessionStatus;
  last_activity_at: string;
}): boolean {
  if (row.status !== "in_progress") return false;
  const cutoff = Date.now() - INACTIVITY_DAYS * 24 * 60 * 60 * 1000;
  return new Date(row.last_activity_at).getTime() < cutoff;
}

/** Reads a profile answer's option value, for list filtering. */
function optionValue(value: unknown): string | null {
  const parsed = value as ResponseValue | null;
  if (!parsed) return null;
  if (parsed.kind === "single") return parsed.other?.trim() || parsed.value;
  return null;
}

export async function listSessions(): Promise<SessionListItem[]> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase
    .from("sessions")
    .select(
      `id, response_mode, status, started_at, last_activity_at, completed_at,
       participants ( participant_code ),
       questionnaire_versions ( version ),
       responses ( question_key, value, skipped )`
    )
    .order("started_at", { ascending: false });

  if (error) throw new Error(`Could not load sessions: ${error.message}`);

  return (data as unknown as SessionRow[]).map((row) => ({
    id: row.id,
    participantCode: row.participants.participant_code,
    responseMode: row.response_mode,
    status: row.status,
    derivedStatus: isInactive(row) ? "inactive" : row.status,
    questionnaireVersion: row.questionnaire_versions.version,
    startedAt: row.started_at,
    lastActivityAt: row.last_activity_at,
    completedAt: row.completed_at,
    durationMinutes: row.completed_at
      ? Math.round(
          (new Date(row.completed_at).getTime() -
            new Date(row.started_at).getTime()) /
            60000
        )
      : null,
    role: optionValue(
      row.responses.find((r) => r.question_key === "profile-role")?.value
    ),
    industry: optionValue(
      row.responses.find((r) => r.question_key === "profile-industry")?.value
    ),
    answeredCount: row.responses.filter((r) => !r.skipped && r.value !== null)
      .length,
  }));
}

export interface DashboardStats {
  total: number;
  completed: number;
  inProgress: number;
  inactive: number;
  byMode: Record<ResponseMode, number>;
}

export function summarise(sessions: SessionListItem[]): DashboardStats {
  return {
    total: sessions.length,
    completed: sessions.filter((s) => s.status === "completed").length,
    inProgress: sessions.filter((s) => s.derivedStatus === "in_progress")
      .length,
    inactive: sessions.filter((s) => s.derivedStatus === "inactive").length,
    byMode: {
      asynchronous_form: sessions.filter(
        (s) => s.responseMode === "asynchronous_form"
      ).length,
      live_interview: sessions.filter(
        (s) => s.responseMode === "live_interview"
      ).length,
    },
  };
}

export interface SessionDetailResponse {
  questionKey: string;
  construct: string;
  responseType: string;
  question: InterviewQuestion | null;
  value: ResponseValue | null;
  skipped: boolean;
  method: string;
  recordedAt: string;
  updatedAt: string;
}

export interface SessionDetail {
  id: string;
  participantCode: string;
  responseMode: ResponseMode;
  status: SessionStatus;
  questionnaireVersion: string;
  startedAt: string;
  lastActivityAt: string;
  completedAt: string | null;
  researcherNotes: string | null;
  consent: {
    version: string;
    participationConsent: boolean;
    recordingConsent: boolean | null;
    consentedAt: string;
    withdrawnAt: string | null;
  } | null;
  responsesByConstruct: Array<{
    construct: string;
    responses: SessionDetailResponse[];
  }>;
}

export async function getSessionDetail(
  sessionId: string
): Promise<SessionDetail | null> {
  const supabase = await createServerSupabaseClient();

  const { data: session, error } = await supabase
    .from("sessions")
    .select(
      `id, response_mode, status, started_at, last_activity_at, completed_at,
       researcher_notes,
       participants ( participant_code ),
       questionnaire_versions ( version ),
       consents ( consent_version, participation_consent, recording_consent,
                  consented_at, withdrawn_at ),
       responses ( question_key, construct, response_type, value, skipped, method,
                   recorded_at, updated_at,
                   questionnaire_questions ( definition, position ) )`
    )
    .eq("id", sessionId)
    .maybeSingle();

  if (error || !session) return null;

  const rows = (session.responses ?? []) as unknown as Array<{
    question_key: string;
    construct: string;
    response_type: string;
    value: unknown;
    skipped: boolean;
    method: string;
    recorded_at: string;
    updated_at: string;
    questionnaire_questions: { definition: unknown; position: number } | null;
  }>;

  const sorted = [...rows].sort(
    (a, b) =>
      (a.questionnaire_questions?.position ?? 0) -
      (b.questionnaire_questions?.position ?? 0)
  );

  const byConstruct = new Map<string, SessionDetailResponse[]>();
  for (const row of sorted) {
    const item: SessionDetailResponse = {
      questionKey: row.question_key,
      construct: row.construct,
      responseType: row.response_type,
      question: (row.questionnaire_questions?.definition ??
        null) as InterviewQuestion | null,
      value: (row.value as ResponseValue | null) ?? null,
      skipped: row.skipped,
      method: row.method,
      recordedAt: row.recorded_at,
      updatedAt: row.updated_at,
    };
    const list = byConstruct.get(row.construct) ?? [];
    list.push(item);
    byConstruct.set(row.construct, list);
  }

  const consent = session.consents?.[0] ?? null;

  return {
    id: session.id,
    participantCode: session.participants.participant_code,
    responseMode: session.response_mode,
    status: session.status,
    questionnaireVersion: session.questionnaire_versions.version,
    startedAt: session.started_at,
    lastActivityAt: session.last_activity_at,
    completedAt: session.completed_at,
    researcherNotes: session.researcher_notes,
    consent: consent
      ? {
          version: consent.consent_version,
          participationConsent: consent.participation_consent,
          recordingConsent: consent.recording_consent,
          consentedAt: consent.consented_at,
          withdrawnAt: consent.withdrawn_at,
        }
      : null,
    responsesByConstruct: [...byConstruct.entries()].map(
      ([construct, responses]) => ({
        construct,
        responses,
      })
    ),
  };
}

export interface ConstructResponse {
  participantCode: string;
  responseMode: ResponseMode;
  questionKey: string;
  prompt: string;
  value: ResponseValue | null;
  skipped: boolean;
  recordedAt: string;
}

export interface ConstructGroup {
  construct: string;
  responses: ConstructResponse[];
}

/** Cross-participant view, grouped by construct, for qualitative coding. */
export async function listResponsesByConstruct(): Promise<ConstructGroup[]> {
  const supabase = await createServerSupabaseClient();

  // Paged for the same reason as the export: a single request stops at
  // 1000 rows, which would quietly hide later participants from this view.
  const collected: unknown[] = [];
  for (let page = 0; ; page += 1) {
    const { data, error } = await supabase
      .from("responses")
      .select(
        `question_key, construct, value, skipped, recorded_at,
       sessions ( response_mode, participants ( participant_code ) ),
       questionnaire_questions ( definition, position )`
      )
      .order("construct", { ascending: true })
      .order("recorded_at", { ascending: true })
      .range(page * RESPONSE_PAGE_SIZE, (page + 1) * RESPONSE_PAGE_SIZE - 1);

    if (error) throw new Error(`Could not load responses: ${error.message}`);
    collected.push(...(data ?? []));
    if (!data || data.length < RESPONSE_PAGE_SIZE) break;
  }

  const rows = collected as unknown as Array<{
    question_key: string;
    construct: string;
    value: unknown;
    skipped: boolean;
    recorded_at: string;
    sessions: {
      response_mode: ResponseMode;
      participants: { participant_code: string };
    };
    questionnaire_questions: { definition: { prompt?: string } | null } | null;
  }>;

  const groups = new Map<string, ConstructResponse[]>();
  for (const row of rows) {
    const list = groups.get(row.construct) ?? [];
    list.push({
      participantCode: row.sessions.participants.participant_code,
      responseMode: row.sessions.response_mode,
      questionKey: row.question_key,
      prompt:
        row.questionnaire_questions?.definition?.prompt ?? row.question_key,
      value: (row.value as ResponseValue | null) ?? null,
      skipped: row.skipped,
      recordedAt: row.recorded_at,
    });
    groups.set(row.construct, list);
  }

  return [...groups.entries()].map(([construct, responses]) => ({
    construct,
    responses,
  }));
}

export interface QuestionHealth {
  questionKey: string;
  prompt: string;
  construct: string;
  answered: number;
  skipped: number;
  /** Sessions that stopped on this question without answering it. */
  lastSeen: number;
}

/**
 * Pilot signal: which questions get skipped, and where unfinished sessions
 * come to a halt. Derived from responses already collected — no extra
 * behavioural tracking of participants.
 */
export async function getQuestionHealth(): Promise<QuestionHealth[]> {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.from("responses").select(
    `question_key, construct, skipped, value,
       questionnaire_questions ( definition, position )`
  );
  if (error)
    throw new Error(`Could not load question health: ${error.message}`);

  const { data: stalled } = await supabase
    .from("sessions")
    .select("current_step_id")
    .eq("status", "in_progress");

  const stalledCounts = new Map<string, number>();
  for (const row of stalled ?? []) {
    const key = row.current_step_id.startsWith("question:")
      ? row.current_step_id.slice("question:".length)
      : null;
    if (key) stalledCounts.set(key, (stalledCounts.get(key) ?? 0) + 1);
  }

  const rows = (data ?? []) as unknown as Array<{
    question_key: string;
    construct: string;
    skipped: boolean;
    value: unknown;
    questionnaire_questions: {
      definition: { prompt?: string } | null;
      position: number;
    } | null;
  }>;

  const byQuestion = new Map<string, QuestionHealth & { position: number }>();
  for (const row of rows) {
    const existing = byQuestion.get(row.question_key) ?? {
      questionKey: row.question_key,
      prompt:
        row.questionnaire_questions?.definition?.prompt ?? row.question_key,
      construct: row.construct,
      answered: 0,
      skipped: 0,
      lastSeen: stalledCounts.get(row.question_key) ?? 0,
      position: row.questionnaire_questions?.position ?? 0,
    };
    if (row.skipped || row.value === null) existing.skipped += 1;
    else existing.answered += 1;
    byQuestion.set(row.question_key, existing);
  }

  // Include questions nobody has reached yet, so gaps are visible too.
  for (const [key, count] of stalledCounts) {
    if (!byQuestion.has(key)) {
      byQuestion.set(key, {
        questionKey: key,
        prompt: key,
        construct: "",
        answered: 0,
        skipped: 0,
        lastSeen: count,
        position: Number.MAX_SAFE_INTEGER,
      });
    }
  }

  return [...byQuestion.values()]
    .sort((a, b) => a.position - b.position)
    .map((entry) => {
      const { position, ...rest } = entry;
      void position;
      return rest;
    });
}
