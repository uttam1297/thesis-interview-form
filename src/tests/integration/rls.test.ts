import { beforeAll, describe, expect, it } from "vitest";

import {
  createResumeToken,
  hashResumeToken,
} from "@/features/sessions/resume-token";
import {
  anonClient,
  databaseAvailable,
  researcherClient,
  serviceClient,
} from "@/tests/integration/helpers";

/**
 * Row Level Security is the last line of defence: even if an API route were
 * wrong, an anonymous client holding the public anon key must not be able to
 * read or change research data.
 */
describe("row level security", () => {
  let sessionId: string;
  let participantCode: string;

  beforeAll(async () => {
    if (!(await databaseAvailable())) {
      throw new Error(
        "Local Supabase is not running. Start it with: npx supabase start"
      );
    }

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
    participantCode = code!;
    const { data: participant } = await supabase
      .from("participants")
      .insert({ study_id: study!.id, participant_code: code! })
      .select("id")
      .single();
    const { data: session } = await supabase
      .from("sessions")
      .insert({
        participant_id: participant!.id,
        questionnaire_version_id: version!.id,
        response_mode: "asynchronous_form",
        resume_token_hash: hashResumeToken(createResumeToken().token),
      })
      .select("id")
      .single();
    sessionId = session!.id;
  });

  describe("anonymous visitors", () => {
    it("cannot enumerate participants", async () => {
      const { data, error } = await anonClient()
        .from("participants")
        .select("*");
      expect(data ?? []).toHaveLength(0);
      expect(error === null || error.code === "42501").toBe(true);
    });

    it("cannot read sessions or responses", async () => {
      const anon = anonClient();
      const sessions = await anon.from("sessions").select("*");
      const responses = await anon.from("responses").select("*");
      expect(sessions.data ?? []).toHaveLength(0);
      expect(responses.data ?? []).toHaveLength(0);
    });

    it("cannot read consent records", async () => {
      const { data } = await anonClient().from("consents").select("*");
      expect(data ?? []).toHaveLength(0);
    });

    it("cannot write a response into someone else's session", async () => {
      const supabase = serviceClient();
      const { data: question } = await supabase
        .from("questionnaire_questions")
        .select("id, question_key, construct, response_type")
        .limit(1)
        .single();

      const { error } = await anonClient()
        .from("responses")
        .insert({
          session_id: sessionId,
          question_id: question!.id,
          question_key: question!.question_key,
          construct: question!.construct,
          response_type: question!.response_type,
          value: { kind: "text", text: "injected" },
          skipped: false,
          method: "typed",
        });
      expect(error).not.toBeNull();
    });

    it("cannot alter or complete an existing session", async () => {
      const anon = anonClient();
      const { data } = await anon
        .from("sessions")
        .update({ status: "completed" })
        .eq("id", sessionId)
        .select();
      expect(data ?? []).toHaveLength(0);

      const { data: after } = await serviceClient()
        .from("sessions")
        .select("status")
        .eq("id", sessionId)
        .single();
      expect(after?.status).toBe("in_progress");
    });

    it("cannot register itself as a researcher", async () => {
      const { error } = await anonClient()
        .from("researcher_profiles")
        .insert({ user_id: "00000000-0000-0000-0000-000000000009" });
      expect(error).not.toBeNull();
    });

    it("cannot mint participant codes", async () => {
      const { data: study } = await serviceClient()
        .from("studies")
        .select("id")
        .eq("slug", "thesis-2026")
        .single();
      const { error } = await anonClient().rpc("next_participant_code", {
        p_study_id: study!.id,
      });
      expect(error).not.toBeNull();
    });
  });

  describe("signed-in researcher", () => {
    it("can read sessions, responses and consents", async () => {
      const researcher = await researcherClient();
      const sessions = await researcher.from("sessions").select("id, status");
      expect(sessions.error).toBeNull();
      expect((sessions.data ?? []).length).toBeGreaterThan(0);

      const participants = await researcher
        .from("participants")
        .select("participant_code");
      expect(
        (participants.data ?? []).some(
          (p) => p.participant_code === participantCode
        )
      ).toBe(true);

      expect((await researcher.from("consents").select("id")).error).toBeNull();
      expect(
        (await researcher.from("responses").select("id")).error
      ).toBeNull();
    });

    it("cannot delete research data", async () => {
      const researcher = await researcherClient();
      const { data } = await researcher
        .from("sessions")
        .delete()
        .eq("id", sessionId)
        .select();
      expect(data ?? []).toHaveLength(0);

      const { data: stillThere } = await serviceClient()
        .from("sessions")
        .select("id")
        .eq("id", sessionId)
        .maybeSingle();
      expect(stillThere).not.toBeNull();
    });

    it("cannot create an asynchronous session masquerading as participant traffic", async () => {
      const researcher = await researcherClient();
      const { data: study } = await serviceClient()
        .from("studies")
        .select("id")
        .eq("slug", "thesis-2026")
        .single();
      const { data: version } = await serviceClient()
        .from("questionnaire_versions")
        .select("id")
        .limit(1)
        .single();
      const { data: participant } = await serviceClient()
        .from("participants")
        .insert({
          study_id: study!.id,
          participant_code: `PX${Date.now() % 100000}`,
        })
        .select("id")
        .single();

      const { error } = await researcher.from("sessions").insert({
        participant_id: participant!.id,
        questionnaire_version_id: version!.id,
        response_mode: "asynchronous_form",
        resume_token_hash: hashResumeToken(createResumeToken().token),
      });
      // Only live_interview sessions may be created by a researcher.
      expect(error).not.toBeNull();
    });
  });
});
