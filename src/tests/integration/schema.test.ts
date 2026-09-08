import { beforeAll, describe, expect, it } from "vitest";

import {
  createResumeToken,
  hashResumeToken,
} from "@/features/sessions/resume-token";
import { databaseAvailable, serviceClient } from "@/tests/integration/helpers";

/**
 * Schema and persistence behaviour against the real database: the migration
 * is the contract, so these assertions run on actual Postgres rather than a
 * mock.
 */
describe("schema and persistence", () => {
  beforeAll(async () => {
    if (!(await databaseAvailable())) {
      throw new Error(
        "Local Supabase is not running. Start it with: npx supabase start"
      );
    }
  });

  it("has a published questionnaire version with its questions frozen", async () => {
    const supabase = serviceClient();
    const { data: version } = await supabase
      .from("questionnaire_versions")
      .select("id, version, definition_hash")
      .order("published_at", { ascending: false })
      .limit(1)
      .single();

    expect(version?.definition_hash).toMatch(/^[0-9a-f]{64}$/);

    const { count } = await supabase
      .from("questionnaire_questions")
      .select("id", { count: "exact", head: true })
      .eq("questionnaire_version_id", version!.id);
    expect(count).toBeGreaterThan(20);
  });

  it("persists a session, consent and responses tied to a question version", async () => {
    const supabase = serviceClient();
    const { data: study } = await supabase
      .from("studies")
      .select("id")
      .eq("slug", "thesis-2026")
      .single();
    const { data: version } = await supabase
      .from("questionnaire_versions")
      .select("id")
      .order("published_at", { ascending: false })
      .limit(1)
      .single();

    const { data: code } = await supabase.rpc("next_participant_code", {
      p_study_id: study!.id,
    });
    expect(code).toMatch(/^P\d{3}$/);

    const { data: participant } = await supabase
      .from("participants")
      .insert({ study_id: study!.id, participant_code: code! })
      .select("id")
      .single();

    const { token } = createResumeToken();
    const { data: session } = await supabase
      .from("sessions")
      .insert({
        participant_id: participant!.id,
        questionnaire_version_id: version!.id,
        response_mode: "asynchronous_form",
        resume_token_hash: hashResumeToken(token),
      })
      .select("id, status, resume_expires_at")
      .single();

    expect(session?.status).toBe("in_progress");
    // Resume links expire, limiting the window a leaked link is usable.
    expect(new Date(session!.resume_expires_at).getTime()).toBeGreaterThan(
      Date.now()
    );

    const { data: consent } = await supabase
      .from("consents")
      .insert({
        session_id: session!.id,
        participant_id: participant!.id,
        consent_version: "v1-test",
        participation_consent: true,
        recording_consent: null,
      })
      .select("recording_consent")
      .single();
    // Recording consent stays null unless it was explicitly asked.
    expect(consent?.recording_consent).toBeNull();

    const { data: question } = await supabase
      .from("questionnaire_questions")
      .select("id, question_key, construct, response_type")
      .eq("questionnaire_version_id", version!.id)
      .eq("question_key", "profile-role")
      .single();

    const { data: response } = await supabase
      .from("responses")
      .insert({
        session_id: session!.id,
        question_id: question!.id,
        question_key: question!.question_key,
        construct: question!.construct,
        response_type: question!.response_type,
        value: { kind: "single", value: "product_manager" },
        skipped: false,
        method: "selected",
      })
      .select("id, value, question_id")
      .single();

    expect(response?.value).toEqual({
      kind: "single",
      value: "product_manager",
    });
    expect(response?.question_id).toBe(question!.id);

    // One row per question per session: re-answering updates, never duplicates.
    const { error: duplicateError } = await supabase.from("responses").insert({
      session_id: session!.id,
      question_id: question!.id,
      question_key: question!.question_key,
      construct: question!.construct,
      response_type: question!.response_type,
      value: { kind: "single", value: "ux_researcher" },
      skipped: false,
      method: "selected",
    });
    expect(duplicateError).not.toBeNull();
  });

  it("refuses to delete a questionnaire version that has responses", async () => {
    const supabase = serviceClient();
    const { data: version } = await supabase
      .from("questionnaire_versions")
      .select("id")
      .order("published_at", { ascending: false })
      .limit(1)
      .single();

    const { error } = await supabase
      .from("questionnaire_versions")
      .delete()
      .eq("id", version!.id);
    // Historical wording must remain readable for collected data.
    expect(error).not.toBeNull();
  });
});
