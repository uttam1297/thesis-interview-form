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
export type StorageGeneration = "v1" | "v2";
export type StudyStage = "not_recorded" | "pilot_v2" | "formal_v2";

/** Supabase returns at most 1000 rows per request. */
const RESPONSE_PAGE_SIZE = 1000;

/** A session with no activity for this long is treated as abandoned. */
const INACTIVITY_DAYS = 14;

export interface SessionListItem {
  id: string;
  storageGeneration: StorageGeneration;
  participantCode: string;
  /** Minutes from start to submission; null while still in progress. */
  durationMinutes: number | null;
  responseMode: ResponseMode;
  status: SessionStatus;
  derivedStatus: SessionStatus | "inactive";
  questionnaireVersion: string;
  studyStage: StudyStage;
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

interface V2SessionRow {
  id: string;
  response_mode: ResponseMode;
  status: SessionStatus;
  study_stage: "pilot_v2" | "formal_v2";
  started_at: string;
  last_activity_at: string;
  completed_at: string | null;
  participant_code: string;
  questionnaire_version: string;
  interview_v2_responses: Array<{
    question_id: string;
    response_value: unknown;
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
  const [legacyResult, v2Result] = await Promise.all([
    supabase
      .from("sessions")
      .select(
        `id, response_mode, status, started_at, last_activity_at, completed_at,
         participants ( participant_code ),
         questionnaire_versions ( version ),
         responses ( question_key, value, skipped )`
      )
      .order("started_at", { ascending: false }),
    supabase
      .from("interview_v2_sessions")
      .select(
        `id, response_mode, status, study_stage, started_at, last_activity_at,
         completed_at, participant_code, questionnaire_version,
         interview_v2_responses ( question_id, response_value, skipped )`
      )
      .order("started_at", { ascending: false }),
  ]);

  if (legacyResult.error) {
    throw new Error(
      `Could not load V1 sessions: ${legacyResult.error.message}`
    );
  }
  if (v2Result.error) {
    throw new Error(`Could not load V2 sessions: ${v2Result.error.message}`);
  }

  const legacy: SessionListItem[] = (
    legacyResult.data as unknown as SessionRow[]
  ).map((row) => ({
    id: row.id,
    storageGeneration: "v1" as const,
    participantCode: row.participants.participant_code,
    responseMode: row.response_mode,
    status: row.status,
    derivedStatus: isInactive(row) ? "inactive" : row.status,
    questionnaireVersion: row.questionnaire_versions.version,
    studyStage: "not_recorded" as const,
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

  const v2: SessionListItem[] = (
    v2Result.data as unknown as V2SessionRow[]
  ).map((row) => ({
    id: row.id,
    storageGeneration: "v2" as const,
    participantCode: row.participant_code,
    responseMode: row.response_mode,
    status: row.status,
    derivedStatus: isInactive(row) ? ("inactive" as const) : row.status,
    questionnaireVersion: row.questionnaire_version,
    studyStage: row.study_stage,
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
      row.interview_v2_responses.find(
        (response) => response.question_id === "v2_profile_role"
      )?.response_value
    ),
    industry: optionValue(
      row.interview_v2_responses.find(
        (response) => response.question_id === "v2_profile_industry"
      )?.response_value
    ),
    answeredCount: row.interview_v2_responses.filter(
      (response) => !response.skipped && response.response_value !== null
    ).length,
  }));

  return [...legacy, ...v2].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
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
  constructs: string[];
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
  storageGeneration: StorageGeneration;
  participantCode: string;
  responseMode: ResponseMode;
  status: SessionStatus;
  questionnaireVersion: string;
  studyStage: StudyStage;
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
  sessionId: string,
  storageGeneration: StorageGeneration = "v1"
): Promise<SessionDetail | null> {
  if (storageGeneration === "v2") return getV2SessionDetail(sessionId);
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
      constructs: [row.construct],
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
    storageGeneration: "v1",
    participantCode: session.participants.participant_code,
    responseMode: session.response_mode,
    status: session.status,
    questionnaireVersion: session.questionnaire_versions.version,
    studyStage: "not_recorded",
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

async function getV2SessionDetail(
  sessionId: string
): Promise<SessionDetail | null> {
  const supabase = await createServerSupabaseClient();
  const { data: session, error } = await supabase
    .from("interview_v2_sessions")
    .select(
      `id, participant_code, response_mode, status, questionnaire_version,
       study_stage, started_at, last_activity_at, completed_at, researcher_notes,
       interview_v2_consents ( consent_version, participation_consent,
         recording_consent, consented_at, withdrawn_at ),
       interview_v2_responses ( question_id, constructs, response_type,
         response_value, skipped, method, created_at, updated_at,
         interview_v2_questions ( definition, position ) )`
    )
    .eq("id", sessionId)
    .maybeSingle();
  if (error || !session) return null;

  const rows = (session.interview_v2_responses ?? []) as unknown as Array<{
    question_id: string;
    constructs: string[];
    response_type: string;
    response_value: unknown;
    skipped: boolean;
    method: string;
    created_at: string;
    updated_at: string;
    interview_v2_questions: { definition: unknown; position: number } | null;
  }>;
  const sorted = [...rows].sort(
    (a, b) =>
      (a.interview_v2_questions?.position ?? 0) -
      (b.interview_v2_questions?.position ?? 0)
  );
  const byConstruct = new Map<string, SessionDetailResponse[]>();
  for (const row of sorted) {
    const construct = row.constructs[0] ?? "unclassified";
    const item: SessionDetailResponse = {
      questionKey: row.question_id,
      construct,
      constructs: row.constructs,
      responseType: row.response_type,
      question: (row.interview_v2_questions?.definition ??
        null) as InterviewQuestion | null,
      value: (row.response_value as ResponseValue | null) ?? null,
      skipped: row.skipped,
      method: row.method,
      recordedAt: row.created_at,
      updatedAt: row.updated_at,
    };
    const list = byConstruct.get(construct) ?? [];
    list.push(item);
    byConstruct.set(construct, list);
  }
  const consent = session.interview_v2_consents?.[0] ?? null;

  return {
    id: session.id,
    storageGeneration: "v2",
    participantCode: session.participant_code,
    responseMode: session.response_mode,
    status: session.status,
    questionnaireVersion: session.questionnaire_version,
    studyStage: session.study_stage as StudyStage,
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
      ([construct, responses]) => ({ construct, responses })
    ),
  };
}

export interface ConstructResponse {
  participantCode: string;
  storageGeneration: StorageGeneration;
  questionnaireVersion: string;
  studyStage: StudyStage;
  responseMode: ResponseMode;
  questionKey: string;
  prompt: string;
  question: InterviewQuestion | null;
  value: ResponseValue | null;
  skipped: boolean;
  recordedAt: string;
}

export interface ConstructGroup {
  construct: string;
  storageGeneration: StorageGeneration;
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
      questionnaire_versions?: { version: string };
    };
    questionnaire_questions: { definition: { prompt?: string } | null } | null;
  }>;

  const v2Collected: unknown[] = [];
  for (let page = 0; ; page += 1) {
    const { data, error } = await supabase
      .from("interview_v2_responses")
      .select(
        `question_id, constructs, response_value, skipped, created_at,
         interview_v2_sessions ( participant_code, response_mode,
           questionnaire_version, study_stage ),
         interview_v2_questions ( definition, position )`
      )
      .order("created_at", { ascending: true })
      .range(page * RESPONSE_PAGE_SIZE, (page + 1) * RESPONSE_PAGE_SIZE - 1);
    if (error) throw new Error(`Could not load V2 responses: ${error.message}`);
    v2Collected.push(...(data ?? []));
    if (!data || data.length < RESPONSE_PAGE_SIZE) break;
  }

  const groups = new Map<
    string,
    { storageGeneration: StorageGeneration; responses: ConstructResponse[] }
  >();
  for (const row of rows) {
    const key = `v1:${row.construct}`;
    const group = groups.get(key) ?? {
      storageGeneration: "v1" as const,
      responses: [],
    };
    group.responses.push({
      participantCode: row.sessions.participants.participant_code,
      storageGeneration: "v1",
      questionnaireVersion: "2.4.0",
      studyStage: "not_recorded",
      responseMode: row.sessions.response_mode,
      questionKey: row.question_key,
      prompt:
        row.questionnaire_questions?.definition?.prompt ?? row.question_key,
      question:
        (row.questionnaire_questions?.definition as InterviewQuestion | null) ??
        null,
      value: (row.value as ResponseValue | null) ?? null,
      skipped: row.skipped,
      recordedAt: row.recorded_at,
    });
    groups.set(key, group);
  }

  const v2Rows = v2Collected as Array<{
    question_id: string;
    constructs: string[];
    response_value: unknown;
    skipped: boolean;
    created_at: string;
    interview_v2_sessions: {
      participant_code: string;
      response_mode: ResponseMode;
      questionnaire_version: string;
      study_stage: "pilot_v2" | "formal_v2";
    };
    interview_v2_questions: { definition: { prompt?: string } | null } | null;
  }>;
  for (const row of v2Rows) {
    for (const construct of row.constructs) {
      const key = `v2:${construct}`;
      const group = groups.get(key) ?? {
        storageGeneration: "v2" as const,
        responses: [],
      };
      group.responses.push({
        participantCode: row.interview_v2_sessions.participant_code,
        storageGeneration: "v2",
        questionnaireVersion: row.interview_v2_sessions.questionnaire_version,
        studyStage: row.interview_v2_sessions.study_stage,
        responseMode: row.interview_v2_sessions.response_mode,
        questionKey: row.question_id,
        prompt:
          row.interview_v2_questions?.definition?.prompt ?? row.question_id,
        question:
          (row.interview_v2_questions
            ?.definition as InterviewQuestion | null) ?? null,
        value: (row.response_value as ResponseValue | null) ?? null,
        skipped: row.skipped,
        recordedAt: row.created_at,
      });
      groups.set(key, group);
    }
  }

  return [...groups.entries()].map(([key, group]) => ({
    construct: key.slice(3),
    storageGeneration: group.storageGeneration,
    responses: group.responses,
  }));
}

export interface QuestionHealth {
  storageGeneration: StorageGeneration;
  questionnaireVersion: string;
  studyStage: StudyStage;
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

  const [legacyResponses, legacyStalled, v2Responses, v2Stalled] =
    await Promise.all([
      supabase.from("responses").select(
        `question_key, construct, skipped, value,
         sessions ( questionnaire_versions ( version ) ),
         questionnaire_questions ( definition, position )`
      ),
      supabase
        .from("sessions")
        .select("current_step_id, questionnaire_versions ( version )")
        .eq("status", "in_progress"),
      supabase.from("interview_v2_responses").select(
        `question_id, constructs, skipped, response_value,
         interview_v2_sessions ( questionnaire_version, study_stage ),
         interview_v2_questions ( definition, position )`
      ),
      supabase
        .from("interview_v2_sessions")
        .select("current_step_id, questionnaire_version, study_stage")
        .eq("status", "in_progress"),
    ]);

  if (legacyResponses.error) {
    throw new Error(
      `Could not load V1 question health: ${legacyResponses.error.message}`
    );
  }
  if (legacyStalled.error) {
    throw new Error(
      `Could not load stalled V1 sessions: ${legacyStalled.error.message}`
    );
  }
  if (v2Responses.error) {
    throw new Error(
      `Could not load V2 question health: ${v2Responses.error.message}`
    );
  }
  if (v2Stalled.error) {
    throw new Error(
      `Could not load stalled V2 sessions: ${v2Stalled.error.message}`
    );
  }

  const stalledCounts = new Map<string, number>();
  for (const row of legacyStalled.data ?? []) {
    const key = row.current_step_id.startsWith("question:")
      ? row.current_step_id.slice("question:".length)
      : null;
    if (key) {
      const version = row.questionnaire_versions.version;
      const groupKey = `v1:${version}:not_recorded:${key}`;
      stalledCounts.set(groupKey, (stalledCounts.get(groupKey) ?? 0) + 1);
    }
  }
  for (const row of v2Stalled.data ?? []) {
    const key = row.current_step_id.startsWith("question:")
      ? row.current_step_id.slice("question:".length)
      : null;
    if (key) {
      const groupKey = `v2:${row.questionnaire_version}:${row.study_stage}:${key}`;
      stalledCounts.set(groupKey, (stalledCounts.get(groupKey) ?? 0) + 1);
    }
  }

  const rows = (legacyResponses.data ?? []) as unknown as Array<{
    question_key: string;
    construct: string;
    skipped: boolean;
    value: unknown;
    sessions: { questionnaire_versions: { version: string } };
    questionnaire_questions: {
      definition: { prompt?: string } | null;
      position: number;
    } | null;
  }>;

  const byQuestion = new Map<string, QuestionHealth & { position: number }>();
  for (const row of rows) {
    const version = row.sessions.questionnaire_versions.version;
    const groupKey = `v1:${version}:not_recorded:${row.question_key}`;
    const existing = byQuestion.get(groupKey) ?? {
      storageGeneration: "v1" as const,
      questionnaireVersion: version,
      studyStage: "not_recorded" as const,
      questionKey: row.question_key,
      prompt:
        row.questionnaire_questions?.definition?.prompt ?? row.question_key,
      construct: row.construct,
      answered: 0,
      skipped: 0,
      lastSeen: stalledCounts.get(groupKey) ?? 0,
      position: row.questionnaire_questions?.position ?? 0,
    };
    if (row.skipped || row.value === null) existing.skipped += 1;
    else existing.answered += 1;
    byQuestion.set(groupKey, existing);
  }

  const v2Rows = (v2Responses.data ?? []) as unknown as Array<{
    question_id: string;
    constructs: string[];
    skipped: boolean;
    response_value: unknown;
    interview_v2_sessions: {
      questionnaire_version: string;
      study_stage: "pilot_v2" | "formal_v2";
    };
    interview_v2_questions: {
      definition: { prompt?: string } | null;
      position: number;
    } | null;
  }>;
  for (const row of v2Rows) {
    const { questionnaire_version: version, study_stage: stage } =
      row.interview_v2_sessions;
    const groupKey = `v2:${version}:${stage}:${row.question_id}`;
    const existing = byQuestion.get(groupKey) ?? {
      storageGeneration: "v2" as const,
      questionnaireVersion: version,
      studyStage: stage,
      questionKey: row.question_id,
      prompt: row.interview_v2_questions?.definition?.prompt ?? row.question_id,
      construct: row.constructs.join(", "),
      answered: 0,
      skipped: 0,
      lastSeen: stalledCounts.get(groupKey) ?? 0,
      position: row.interview_v2_questions?.position ?? 0,
    };
    if (row.skipped || row.response_value === null) existing.skipped += 1;
    else existing.answered += 1;
    byQuestion.set(groupKey, existing);
  }

  // Include questions nobody has reached yet, so gaps are visible too.
  for (const [groupKey, count] of stalledCounts) {
    if (!byQuestion.has(groupKey)) {
      const [storageGeneration, questionnaireVersion, studyStage, ...parts] =
        groupKey.split(":");
      const questionKey = parts.join(":");
      byQuestion.set(groupKey, {
        storageGeneration: storageGeneration as StorageGeneration,
        questionnaireVersion,
        studyStage: studyStage as StudyStage,
        questionKey,
        prompt: questionKey,
        construct: "",
        answered: 0,
        skipped: 0,
        lastSeen: count,
        position: Number.MAX_SAFE_INTEGER,
      });
    }
  }

  return [...byQuestion.values()]
    .sort(
      (a, b) =>
        a.storageGeneration.localeCompare(b.storageGeneration) ||
        a.studyStage.localeCompare(b.studyStage) ||
        a.position - b.position
    )
    .map((entry) => {
      const { position, ...rest } = entry;
      void position;
      return rest;
    });
}
