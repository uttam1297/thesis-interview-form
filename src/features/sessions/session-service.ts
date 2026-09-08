import "server-only";

import { SessionError } from "@/features/sessions/errors";
import {
  createResumeToken,
  hashResumeToken,
  isWellFormedResumeToken,
} from "@/features/sessions/resume-token";
import { buildSteps } from "@/features/interview/steps";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";
import type {
  InterviewConfig,
  ResponseMethod,
  ResponseRecord,
  ResponseValue,
} from "@/types/interview";

type Supabase = ReturnType<typeof createAdminClient>;
type ResponseMode = Database["public"]["Enums"]["response_mode"];

/**
 * Server-side research session domain.
 *
 * Everything a participant does passes through here: the browser only ever
 * holds a resume token, and this module resolves it to a session before any
 * database work. It runs with the service role, so each function is
 * responsible for its own authorisation check.
 */

export interface SessionSnapshot {
  participantCode: string;
  responseMode: ResponseMode;
  status: Database["public"]["Enums"]["session_status"];
  questionnaireVersion: string;
  config: InterviewConfig;
  currentStepId: string;
  returnToReview: boolean;
  responses: Record<string, ResponseRecord>;
  consent: {
    version: string;
    participationConsent: boolean;
    recordingConsent: boolean | null;
    consentedAt: string;
  } | null;
  startedAt: string;
  completedAt: string | null;
}

interface QuestionRow {
  id: string;
  question_key: string;
  construct: string;
  response_type: string;
}

/** Step ordering comes from the engine, so it stays consistent everywhere. */
function firstStepAfterConsent(config: InterviewConfig): string {
  const steps = buildSteps(config, {});
  const consentIndex = steps.findIndex((step) => step.kind === "consent");
  return steps[consentIndex + 1]?.id ?? "review";
}

async function activeQuestionnaire(supabase: Supabase) {
  const { STUDY_SLUG } = serverEnv();

  const { data: study, error: studyError } = await supabase
    .from("studies")
    .select("id")
    .eq("slug", STUDY_SLUG)
    .single();
  if (studyError || !study) {
    throw new SessionError("unavailable", "Study is not configured");
  }

  const { data: version, error: versionError } = await supabase
    .from("questionnaire_versions")
    .select("id, version, definition")
    .eq("study_id", study.id)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (versionError || !version) {
    throw new SessionError(
      "unavailable",
      "No questionnaire version has been published"
    );
  }

  return { studyId: study.id, version };
}

async function questionsFor(
  supabase: Supabase,
  questionnaireVersionId: string
) {
  const { data, error } = await supabase
    .from("questionnaire_questions")
    .select("id, question_key, construct, response_type")
    .eq("questionnaire_version_id", questionnaireVersionId);
  if (error || !data) {
    throw new SessionError("unavailable", "Could not load questionnaire");
  }
  return new Map<string, QuestionRow>(
    data.map((row) => [row.question_key, row])
  );
}

/** Creates a participant, session and consent record in one participant-facing step. */
export async function startSession(input: {
  consentVersion: string;
  participationConsent: boolean;
  recordingConsent: boolean | null;
  responseMode?: ResponseMode;
  createdBy?: string;
}): Promise<{ resumeToken: string; snapshot: SessionSnapshot }> {
  if (!input.participationConsent) {
    throw new SessionError(
      "invalid_token",
      "A session cannot start without participation consent"
    );
  }

  const supabase = createAdminClient();
  const { studyId, version } = await activeQuestionnaire(supabase);

  const { data: code, error: codeError } = await supabase.rpc(
    "next_participant_code",
    { p_study_id: studyId }
  );
  if (codeError || !code) {
    throw new SessionError(
      "unavailable",
      "Could not allocate a participant code"
    );
  }

  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .insert({ study_id: studyId, participant_code: code })
    .select("id, participant_code, created_at")
    .single();
  if (participantError || !participant) {
    throw new SessionError("unavailable", "Could not create participant");
  }

  const { token, tokenHash } = createResumeToken();
  const responseMode: ResponseMode = input.responseMode ?? "asynchronous_form";
  const config = version.definition as unknown as InterviewConfig;

  // A live interview's consent was already recorded by the researcher, so
  // the session opens at the first real step instead of re-asking.
  const startingStepId =
    responseMode === "live_interview"
      ? firstStepAfterConsent(config)
      : "consent";

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      participant_id: participant.id,
      questionnaire_version_id: version.id,
      response_mode: responseMode,
      resume_token_hash: tokenHash,
      created_by: input.createdBy ?? null,
      current_step_id: startingStepId,
    })
    .select(
      "id, current_step_id, return_to_review, started_at, completed_at, status"
    )
    .single();
  if (sessionError || !session) {
    throw new SessionError("unavailable", "Could not create session");
  }

  const { data: consent, error: consentError } = await supabase
    .from("consents")
    .insert({
      session_id: session.id,
      participant_id: participant.id,
      consent_version: input.consentVersion,
      participation_consent: input.participationConsent,
      recording_consent: input.recordingConsent,
      recorded_by: input.createdBy ?? null,
    })
    .select(
      "consent_version, participation_consent, recording_consent, consented_at"
    )
    .single();
  if (consentError || !consent) {
    throw new SessionError("unavailable", "Could not record consent");
  }

  return {
    resumeToken: token,
    snapshot: {
      participantCode: participant.participant_code,
      responseMode,
      status: session.status,
      questionnaireVersion: version.version,
      config: version.definition as unknown as InterviewConfig,
      currentStepId: session.current_step_id,
      returnToReview: session.return_to_review,
      responses: {},
      consent: {
        version: consent.consent_version,
        participationConsent: consent.participation_consent,
        recordingConsent: consent.recording_consent,
        consentedAt: consent.consented_at,
      },
      startedAt: session.started_at,
      completedAt: session.completed_at,
    },
  };
}

async function resolveSession(supabase: Supabase, resumeToken: string) {
  if (!isWellFormedResumeToken(resumeToken)) {
    throw new SessionError("invalid_token", "Malformed resume token");
  }

  const { data, error } = await supabase
    .from("sessions")
    .select(
      `id, status, response_mode, current_step_id, return_to_review, started_at,
       completed_at, resume_expires_at, questionnaire_version_id,
       participants ( participant_code ),
       questionnaire_versions ( version, definition )`
    )
    .eq("resume_token_hash", hashResumeToken(resumeToken))
    .maybeSingle();

  if (error) throw new SessionError("unavailable", "Could not load session");
  if (!data) throw new SessionError("invalid_token", "Unknown resume token");
  if (new Date(data.resume_expires_at).getTime() < Date.now()) {
    throw new SessionError("expired", "Resume link expired");
  }
  return data;
}

/** Loads a session and every answer recorded so far. */
export async function getSession(
  resumeToken: string
): Promise<SessionSnapshot> {
  const supabase = createAdminClient();
  const session = await resolveSession(supabase, resumeToken);

  const { data: responseRows, error: responsesError } = await supabase
    .from("responses")
    .select("question_key, value, skipped, method, updated_at")
    .eq("session_id", session.id);
  if (responsesError) {
    throw new SessionError("unavailable", "Could not load responses");
  }

  const responses: Record<string, ResponseRecord> = {};
  for (const row of responseRows ?? []) {
    responses[row.question_key] = {
      questionId: row.question_key,
      value: (row.value as ResponseValue | null) ?? null,
      skipped: row.skipped,
      method: row.method as ResponseMethod,
      updatedAt: row.updated_at,
    };
  }

  const { data: consent } = await supabase
    .from("consents")
    .select(
      "consent_version, participation_consent, recording_consent, consented_at"
    )
    .eq("session_id", session.id)
    .order("consented_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    participantCode: session.participants.participant_code,
    responseMode: session.response_mode,
    status: session.status,
    questionnaireVersion: session.questionnaire_versions.version,
    config: session.questionnaire_versions
      .definition as unknown as InterviewConfig,
    currentStepId: session.current_step_id,
    returnToReview: session.return_to_review,
    responses,
    consent: consent
      ? {
          version: consent.consent_version,
          participationConsent: consent.participation_consent,
          recordingConsent: consent.recording_consent,
          consentedAt: consent.consented_at,
        }
      : null,
    startedAt: session.started_at,
    completedAt: session.completed_at,
  };
}

export interface ResponseUpsert {
  questionKey: string;
  value: ResponseValue | null;
  skipped: boolean;
  method: ResponseMethod;
  updatedAt: string;
}

/** Plain-text projection of an answer, for search and qualitative export. */
function textValueOf(value: ResponseValue | null): string | null {
  if (!value) return null;
  if (value.kind === "text") return value.text;
  if (value.kind === "single") return value.other ?? null;
  if (value.kind === "multi") return value.other ?? null;
  return null;
}

/** Saves a batch of answers plus the participant's position in the flow. */
export async function saveResponses(input: {
  resumeToken: string;
  responses: ResponseUpsert[];
  currentStepId?: string;
  returnToReview?: boolean;
}): Promise<{ savedAt: string }> {
  const supabase = createAdminClient();
  const session = await resolveSession(supabase, input.resumeToken);
  if (session.status === "completed") {
    throw new SessionError("already_completed", "Session already submitted");
  }

  if (input.responses.length > 0) {
    const questions = await questionsFor(
      supabase,
      session.questionnaire_version_id
    );
    const rows = input.responses.flatMap((response) => {
      const question = questions.get(response.questionKey);
      if (!question) return [];
      return [
        {
          session_id: session.id,
          question_id: question.id,
          question_key: question.question_key,
          construct: question.construct,
          response_type: question.response_type,
          value:
            response.value as unknown as Database["public"]["Tables"]["responses"]["Insert"]["value"],
          text_value: textValueOf(response.value),
          skipped: response.skipped,
          method: response.method,
        },
      ];
    });

    if (rows.length > 0) {
      const { error } = await supabase
        .from("responses")
        .upsert(rows, { onConflict: "session_id,question_id" });
      if (error)
        throw new SessionError("unavailable", "Could not save responses");
    }
  }

  const savedAt = new Date().toISOString();
  const { error: sessionError } = await supabase
    .from("sessions")
    .update({
      current_step_id: input.currentStepId ?? session.current_step_id,
      return_to_review: input.returnToReview ?? session.return_to_review,
      last_activity_at: savedAt,
    })
    .eq("id", session.id);
  if (sessionError) {
    throw new SessionError("unavailable", "Could not update session");
  }

  return { savedAt };
}

/** Marks a session complete; further writes are refused. */
export async function submitSession(
  resumeToken: string
): Promise<{ participantCode: string; completedAt: string }> {
  const supabase = createAdminClient();
  const session = await resolveSession(supabase, resumeToken);
  if (session.status === "completed") {
    throw new SessionError("already_completed", "Session already submitted");
  }

  const completedAt = new Date().toISOString();
  const { error } = await supabase
    .from("sessions")
    .update({
      status: "completed",
      completed_at: completedAt,
      last_activity_at: completedAt,
    })
    .eq("id", session.id)
    .eq("status", "in_progress");
  if (error) throw new SessionError("unavailable", "Could not submit session");

  return {
    participantCode: session.participants.participant_code,
    completedAt,
  };
}
