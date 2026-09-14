import { beforeAll, describe, expect, it } from "vitest";

import { hashResumeToken } from "@/features/sessions/resume-token";
import {
  anonClient,
  databaseAvailable,
  researcherClient,
  serviceClient,
} from "@/tests/integration/helpers";

async function legacySnapshot() {
  const supabase = serviceClient();
  const [participants, sessions, consents, responses] = await Promise.all([
    supabase.from("participants").select("*").order("id"),
    supabase.from("sessions").select("*").order("id"),
    supabase.from("consents").select("*").order("id"),
    supabase.from("responses").select("*").order("id"),
  ]);
  for (const result of [participants, sessions, consents, responses]) {
    if (result.error) throw result.error;
  }
  return {
    participants: participants.data,
    sessions: sessions.data,
    consents: consents.data,
    responses: responses.data,
  };
}

describe("isolated Questionnaire V2 storage", () => {
  beforeAll(async () => {
    if (!(await databaseAvailable())) {
      throw new Error(
        "Local Supabase is not running. Start it with: npx supabase start"
      );
    }
  });

  it("publishes one frozen V2 definition with exactly 11 V2-specific questions", async () => {
    const supabase = serviceClient();
    const { data: version, error } = await supabase
      .from("interview_v2_questionnaire_versions")
      .select("id, questionnaire_version, definition_hash")
      .eq("questionnaire_version", "v2")
      .single();
    expect(error).toBeNull();
    expect(version?.questionnaire_version).toBe("v2");
    expect(version?.definition_hash).toMatch(/^[0-9a-f]{64}$/);

    const { data: questions } = await supabase
      .from("interview_v2_questions")
      .select("question_id, constructs")
      .eq("questionnaire_version_id", version!.id)
      .order("position");
    expect(questions).toHaveLength(11);
    expect(
      questions?.every((question) => question.question_id.startsWith("v2_"))
    ).toBe(true);
    expect(
      questions?.find(
        (question) => question.question_id === "v2_q4_validation_governance"
      )?.constructs
    ).toEqual([
      "data_quality",
      "verification",
      "ai_trust",
      "human_oversight",
      "governance",
      "security",
      "privacy",
      "compliance",
      "accountability",
      "risk",
    ]);
  });

  it("creates and writes a V2 session without changing any legacy research row", async () => {
    const before = await legacySnapshot();
    const supabase = serviceClient();
    const token = `v2_integration_${crypto.randomUUID().replaceAll("-", "")}`;

    const { data: started, error: startError } = await supabase.rpc(
      "start_interview_v2_session",
      {
        p_study_slug: "thesis-2026",
        p_study_stage: "pilot_v2",
        p_response_mode: "asynchronous_form",
        p_resume_token_hash: hashResumeToken(token),
        p_current_step_id: "question:v2_profile_role",
        p_consent_version: "v2-integration",
        p_recording_consent: false,
        p_created_by: undefined,
      }
    );
    expect(startError).toBeNull();
    const session = started?.[0];
    expect(session?.participant_code).toMatch(/^V2P\d{3,}$/);
    expect(session?.study_stage).toBe("pilot_v2");

    const { data: question } = await supabase
      .from("interview_v2_questions")
      .select(
        "id, question_id, question_version, section, constructs, response_type"
      )
      .eq("question_id", "v2_q1_decision_context")
      .single();
    const { data: response, error: responseError } = await supabase
      .from("interview_v2_responses")
      .insert({
        session_id: session!.session_id,
        participant_code: session!.participant_code,
        questionnaire_version: "v2",
        question_definition_id: question!.id,
        question_id: question!.question_id,
        question_version: question!.question_version,
        section: question!.section,
        constructs: question!.constructs,
        response_type: question!.response_type,
        response_value: {
          kind: "guided_text",
          text: "A real integration-test decision.",
        },
        text_value: "A real integration-test decision.",
        skipped: false,
        method: "typed",
      })
      .select(
        "response_id, participant_code, questionnaire_version, question_id, constructs"
      )
      .single();
    expect(responseError).toBeNull();
    expect(response?.questionnaire_version).toBe("v2");
    expect(response?.participant_code).toBe(session?.participant_code);
    expect(response?.question_id).toBe("v2_q1_decision_context");
    expect(response?.constructs).toEqual([
      "decision_context",
      "decision_process",
    ]);

    const { data: consent } = await supabase
      .from("interview_v2_consents")
      .select("questionnaire_version, participation_consent")
      .eq("session_id", session!.session_id)
      .single();
    expect(consent).toEqual({
      questionnaire_version: "v2",
      participation_consent: true,
    });

    expect(await legacySnapshot()).toEqual(before);
  });

  it("keeps all V2 research tables inaccessible to anonymous clients", async () => {
    const anon = anonClient();
    for (const table of [
      "interview_v2_questionnaire_versions",
      "interview_v2_questions",
      "interview_v2_sessions",
      "interview_v2_consents",
      "interview_v2_responses",
    ] as const) {
      const { data } = await anon.from(table).select("*");
      expect(data ?? []).toHaveLength(0);
    }

    const { error } = await anon.rpc("start_interview_v2_session", {
      p_study_slug: "thesis-2026",
      p_study_stage: "pilot_v2",
      p_response_mode: "asynchronous_form",
      p_resume_token_hash: hashResumeToken(`v2_anon_${crypto.randomUUID()}`),
      p_current_step_id: "question:v2_profile_role",
      p_consent_version: "v2-integration",
      p_recording_consent: false,
      p_created_by: undefined,
    });
    expect(error).not.toBeNull();
  });

  it("allows only an authenticated researcher to read V2 research rows", async () => {
    const researcher = await researcherClient();
    const sessions = await researcher
      .from("interview_v2_sessions")
      .select("participant_code, questionnaire_version, study_stage");
    const responses = await researcher
      .from("interview_v2_responses")
      .select("question_id, constructs");
    const consents = await researcher
      .from("interview_v2_consents")
      .select("session_id");

    expect(sessions.error).toBeNull();
    expect(responses.error).toBeNull();
    expect(consents.error).toBeNull();
    expect((sessions.data ?? []).length).toBeGreaterThan(0);
  });
});
