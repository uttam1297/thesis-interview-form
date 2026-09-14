import "server-only";

import { buildSteps, visibleQuestionSteps } from "@/features/interview/steps";
import { validateResponse } from "@/features/interview/validate-response";
import {
  createResumeToken,
  hashResumeToken,
  isWellFormedResumeToken,
} from "@/features/sessions/resume-token";
import { SessionError } from "@/features/sessions/errors";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database";
import type {
  InterviewConfig,
  InterviewQuestion,
  ResponseRecord,
  ResponseValue,
} from "@/types/interview";
import type {
  ResponseUpsert,
  SessionSnapshot,
} from "@/features/sessions/session-service";

type Supabase = ReturnType<typeof createAdminClient>;
type ResponseMode = Database["public"]["Enums"]["response_mode"];
export type V2StudyStage = "pilot_v2" | "formal_v2";

interface V2QuestionRow {
  id: string;
  question_id: string;
  question_version: string;
  section: string;
  constructs: string[];
  response_type: string;
  definition: Json;
}

function firstStepAfterConsent(config: InterviewConfig): string {
  const steps = buildSteps(config, {});
  const consentIndex = steps.findIndex((step) => step.kind === "consent");
  return steps[consentIndex + 1]?.id ?? "review";
}

async function activeV2Questionnaire(supabase: Supabase) {
  const { STUDY_SLUG } = serverEnv();
  const { data: study, error: studyError } = await supabase
    .from("studies")
    .select("id")
    .eq("slug", STUDY_SLUG)
    .single();
  if (studyError || !study) {
    throw new SessionError("unavailable", "Study is not configured");
  }

  const { data: version, error } = await supabase
    .from("interview_v2_questionnaire_versions")
    .select("id, questionnaire_version, definition")
    .eq("study_id", study.id)
    .eq("questionnaire_version", "v2")
    .maybeSingle();
  if (error || !version) {
    throw new SessionError("unavailable", "Questionnaire V2 is not published");
  }
  return { studyId: study.id, version };
}

async function questionsFor(
  supabase: Supabase,
  questionnaireVersionId: string
) {
  const { data, error } = await supabase
    .from("interview_v2_questions")
    .select(
      "id, question_id, question_version, section, constructs, response_type, definition"
    )
    .eq("questionnaire_version_id", questionnaireVersionId);
  if (error || !data) {
    throw new SessionError("unavailable", "Could not load questionnaire V2");
  }
  return new Map(
    (data as V2QuestionRow[]).map((question) => [
      question.question_id,
      question,
    ])
  );
}

export async function startV2Session(input: {
  consentVersion: string;
  participationConsent: boolean;
  recordingConsent: boolean | null;
  responseMode?: ResponseMode;
  studyStage?: V2StudyStage;
  createdBy?: string;
}): Promise<{ resumeToken: string; snapshot: SessionSnapshot }> {
  if (!input.participationConsent) {
    throw new SessionError(
      "invalid_token",
      "A session cannot start without participation consent"
    );
  }

  const supabase = createAdminClient();
  const { version } = await activeV2Questionnaire(supabase);

  const base = createResumeToken().token;
  const resumeToken = `v2_${base}`;
  const responseMode = input.responseMode ?? "asynchronous_form";
  const config = version.definition as unknown as InterviewConfig;
  const startingStepId =
    responseMode === "live_interview"
      ? firstStepAfterConsent(config)
      : "consent";

  const { data, error } = await supabase.rpc("start_interview_v2_session", {
    p_study_slug: serverEnv().STUDY_SLUG,
    p_study_stage: input.studyStage ?? "pilot_v2",
    p_response_mode: responseMode,
    p_resume_token_hash: hashResumeToken(resumeToken),
    p_current_step_id: startingStepId,
    p_consent_version: input.consentVersion,
    p_recording_consent: input.recordingConsent ?? false,
    p_created_by: input.createdBy,
  });
  const session = data?.[0];
  if (error || !session) {
    throw new SessionError("unavailable", "Could not create a V2 session");
  }

  return {
    resumeToken,
    snapshot: {
      participantCode: session.participant_code,
      responseMode,
      status: session.status,
      questionnaireVersion: "v2",
      studyStage: session.study_stage as V2StudyStage,
      config,
      currentStepId: session.current_step_id,
      returnToReview: session.return_to_review,
      responses: {},
      consent: {
        version: input.consentVersion,
        participationConsent: true,
        recordingConsent: input.recordingConsent,
        consentedAt: session.consented_at,
      },
      startedAt: session.started_at,
      completedAt: session.completed_at,
    },
  };
}

async function resolveV2Session(supabase: Supabase, resumeToken: string) {
  if (!isWellFormedResumeToken(resumeToken) || !resumeToken.startsWith("v2_")) {
    throw new SessionError("invalid_token", "Malformed V2 resume token");
  }
  const { data, error } = await supabase
    .from("interview_v2_sessions")
    .select(
      `id, participant_code, questionnaire_version, study_stage, status,
       response_mode, current_step_id, return_to_review, started_at, completed_at,
       resume_expires_at, questionnaire_version_id,
       interview_v2_questionnaire_versions ( definition )`
    )
    .eq("resume_token_hash", hashResumeToken(resumeToken))
    .maybeSingle();
  if (error) throw new SessionError("unavailable", "Could not load V2 session");
  if (!data) throw new SessionError("invalid_token", "Unknown V2 resume token");
  if (new Date(data.resume_expires_at).getTime() < Date.now()) {
    throw new SessionError("expired", "V2 resume link expired");
  }
  return data;
}

export async function getV2Session(
  resumeToken: string
): Promise<SessionSnapshot> {
  const supabase = createAdminClient();
  const session = await resolveV2Session(supabase, resumeToken);
  const { data: responseRows, error: responsesError } = await supabase
    .from("interview_v2_responses")
    .select("question_id, response_value, skipped, method, updated_at")
    .eq("session_id", session.id);
  if (responsesError) {
    throw new SessionError("unavailable", "Could not load V2 responses");
  }
  const responses: Record<string, ResponseRecord> = {};
  for (const row of responseRows ?? []) {
    responses[row.question_id] = {
      questionId: row.question_id,
      value: (row.response_value as ResponseValue | null) ?? null,
      skipped: row.skipped,
      method: row.method,
      updatedAt: row.updated_at,
    };
  }

  const { data: consent } = await supabase
    .from("interview_v2_consents")
    .select(
      "consent_version, participation_consent, recording_consent, consented_at"
    )
    .eq("session_id", session.id)
    .maybeSingle();

  return {
    participantCode: session.participant_code,
    responseMode: session.response_mode,
    status: session.status,
    questionnaireVersion: "v2",
    studyStage: session.study_stage as V2StudyStage,
    config: session.interview_v2_questionnaire_versions
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

function optionalElaboration(value: ResponseValue | null): string | null {
  if (value?.kind === "guided_text" || value?.kind === "multi_elaboration") {
    return value.optionalElaboration?.trim() || null;
  }
  return null;
}

function textValueOf(value: ResponseValue | null): string | null {
  if (!value) return null;
  if (value.kind === "text") return value.text;
  if (value.kind === "single" || value.kind === "multi")
    return value.other ?? null;
  if (value.kind === "guided_text") {
    return (
      [value.text, value.optionalElaboration].filter(Boolean).join("\n") || null
    );
  }
  if (value.kind === "multi_elaboration") {
    return (
      [value.other, value.optionalElaboration].filter(Boolean).join("\n") ||
      null
    );
  }
  return null;
}

function allowedValues(question: InterviewQuestion): Set<string> {
  if ("options" in question)
    return new Set(question.options.map((o) => o.value));
  return new Set();
}

/** Validate draft shape and option membership without rejecting partial typing. */
function validateDraft(
  question: InterviewQuestion,
  response: ResponseUpsert,
  responseMode: ResponseMode
): void {
  if (
    (responseMode === "live_interview" && response.method !== "researcher") ||
    (responseMode === "asynchronous_form" && response.method === "researcher")
  ) {
    throw new SessionError("invalid_response", "Invalid response attribution");
  }
  if (response.skipped) {
    if (question.required)
      throw new SessionError(
        "invalid_response",
        "Required V2 response cannot be skipped"
      );
    return;
  }
  const value = response.value;
  if (value === null) return;
  const options = allowedValues(question);
  const allowOther = "allowOther" in question && question.allowOther;
  switch (question.responseType) {
    case "single_select":
      if (value.kind !== "single") break;
      if (
        (!value.other || value.other.length <= 20000) &&
        (options.has(value.value) ||
          (allowOther && value.value === "__other__"))
      )
        return;
      break;
    case "multi_select":
      if (
        value.kind === "multi" &&
        value.values.every(
          (item) => options.has(item) || (allowOther && item === "__other__")
        )
      )
        return;
      break;
    case "multi_select_with_elaboration":
      if (
        value.kind === "multi_elaboration" &&
        value.values.every(
          (item) => options.has(item) || (allowOther && item === "__other__")
        )
      )
        return;
      break;
    case "guided_open":
      if (value.kind === "guided_text") {
        const nonAnswers = new Set(
          question.nonAnswerOptions?.map((o) => o.value)
        );
        if (!value.nonAnswer || nonAnswers.has(value.nonAnswer)) return;
      }
      break;
    case "voice_or_text":
    case "optional_elaboration":
    case "short_text":
    case "long_text":
      if (value.kind === "text") return;
      break;
    case "likert_scale":
      if (value.kind === "scale") return;
      break;
    case "ranking":
      if (value.kind === "ranking") return;
      break;
  }
  throw new SessionError(
    "invalid_response",
    `Invalid response for ${question.id}`
  );
}

export async function saveV2Responses(input: {
  resumeToken: string;
  responses: ResponseUpsert[];
  currentStepId?: string;
  returnToReview?: boolean;
}): Promise<{ savedAt: string }> {
  const supabase = createAdminClient();
  const session = await resolveV2Session(supabase, input.resumeToken);
  if (session.status === "completed") {
    throw new SessionError("already_completed", "Session already submitted");
  }
  const questions = await questionsFor(
    supabase,
    session.questionnaire_version_id
  );

  const rows = input.responses.map((response) => {
    const row = questions.get(response.questionKey);
    if (!row) throw new SessionError("invalid_response", "Unknown V2 question");
    const question = row.definition as unknown as InterviewQuestion;
    validateDraft(question, response, session.response_mode);
    return {
      session_id: session.id,
      participant_code: session.participant_code,
      questionnaire_version: "v2",
      question_definition_id: row.id,
      question_id: row.question_id,
      question_version: row.question_version,
      section: row.section,
      constructs: row.constructs,
      response_type: row.response_type,
      response_value: response.value as unknown as Json,
      optional_elaboration: optionalElaboration(response.value),
      text_value: textValueOf(response.value),
      skipped: response.skipped,
      method: response.method,
    };
  });

  if (rows.length > 0) {
    const { error } = await supabase
      .from("interview_v2_responses")
      .upsert(rows, { onConflict: "session_id,question_id" });
    if (error)
      throw new SessionError("unavailable", "Could not save V2 responses");
  }

  const savedAt = new Date().toISOString();
  const { error: sessionError } = await supabase
    .from("interview_v2_sessions")
    .update({
      current_step_id: input.currentStepId ?? session.current_step_id,
      return_to_review: input.returnToReview ?? session.return_to_review,
      last_activity_at: savedAt,
    })
    .eq("id", session.id);
  if (sessionError)
    throw new SessionError("unavailable", "Could not update V2 session");
  return { savedAt };
}

export async function submitV2Session(
  resumeToken: string
): Promise<{ participantCode: string; completedAt: string }> {
  const snapshot = await getV2Session(resumeToken);
  if (snapshot.status === "completed") {
    throw new SessionError("already_completed", "Session already submitted");
  }
  const required = visibleQuestionSteps(
    buildSteps(snapshot.config, snapshot.responses)
  );
  const invalid = required.find(
    ({ question }) =>
      question.required &&
      validateResponse(question, snapshot.responses[question.id]?.value ?? null)
  );
  if (invalid) {
    throw new SessionError(
      "invalid_response",
      `Incomplete response: ${invalid.question.id}`
    );
  }

  const supabase = createAdminClient();
  const session = await resolveV2Session(supabase, resumeToken);
  const completedAt = new Date().toISOString();
  const { error } = await supabase
    .from("interview_v2_sessions")
    .update({
      status: "completed",
      completed_at: completedAt,
      last_activity_at: completedAt,
    })
    .eq("id", session.id)
    .eq("status", "in_progress");
  if (error)
    throw new SessionError("unavailable", "Could not submit V2 session");
  return { participantCode: session.participant_code, completedAt };
}
