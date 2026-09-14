import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

interface WithdrawInput {
  sessionId: string;
  researcherId: string;
  note?: string;
  storageGeneration?: "v1" | "v2";
}

export interface WithdrawResult {
  participantCode: string;
  deletedResponses: number;
  withdrawnAt: string;
}

/**
 * Deletes a participant's responses and marks their session withdrawn.
 *
 * Runs with the service role deliberately. Row Level Security gives
 * researchers no delete rights — that is a guarantee worth keeping, and it
 * is tested — so the single legitimate deletion path goes through this
 * function, which the route handler calls only after confirming the caller
 * is a researcher.
 *
 * The participant record and the session shell are kept: the pseudonymous
 * code must not be reissued to someone else, and the consent record is
 * evidence that consent was given and later withdrawn. Neither holds
 * anything the participant told me.
 */
export async function withdrawSession({
  sessionId,
  researcherId,
  note,
  storageGeneration = "v1",
}: WithdrawInput): Promise<WithdrawResult> {
  const supabase = createAdminClient();

  if (storageGeneration === "v2") {
    const { data: session, error: sessionError } = await supabase
      .from("interview_v2_sessions")
      .select("id, status, participant_code")
      .eq("id", sessionId)
      .maybeSingle();
    if (sessionError || !session) throw new Error("V2 session not found");
    if (session.status === "withdrawn") {
      throw new Error("Session has already been withdrawn");
    }

    const { count, error: deleteError } = await supabase
      .from("interview_v2_responses")
      .delete({ count: "exact" })
      .eq("session_id", sessionId);
    if (deleteError) throw new Error("Could not delete V2 responses");
    const withdrawnAt = new Date().toISOString();
    const { error: statusError } = await supabase
      .from("interview_v2_sessions")
      .update({ status: "withdrawn", last_activity_at: withdrawnAt })
      .eq("id", sessionId);
    if (statusError) throw new Error("Could not update V2 session");
    const { error: consentError } = await supabase
      .from("interview_v2_consents")
      .update({
        withdrawn_at: withdrawnAt,
        withdrawal_note: note ?? `Withdrawn by researcher ${researcherId}`,
      })
      .eq("session_id", sessionId);
    if (consentError) throw new Error("Could not record V2 withdrawal");
    return {
      participantCode: session.participant_code,
      deletedResponses: count ?? 0,
      withdrawnAt,
    };
  }

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id, status, participants ( participant_code )")
    .eq("id", sessionId)
    .maybeSingle();

  if (sessionError || !session) throw new Error("Session not found");
  if (session.status === "withdrawn") {
    throw new Error("Session has already been withdrawn");
  }

  const { count, error: deleteError } = await supabase
    .from("responses")
    .delete({ count: "exact" })
    .eq("session_id", sessionId);
  if (deleteError)
    throw new Error(`Could not delete responses: ${deleteError.message}`);

  const withdrawnAt = new Date().toISOString();

  const { error: statusError } = await supabase
    .from("sessions")
    .update({ status: "withdrawn", last_activity_at: withdrawnAt })
    .eq("id", sessionId);
  if (statusError)
    throw new Error(`Could not update session: ${statusError.message}`);

  // The consent record keeps the withdrawal on file, as consent law expects.
  const { error: consentError } = await supabase
    .from("consents")
    .update({
      withdrawn_at: withdrawnAt,
      withdrawal_note: note ?? `Withdrawn by researcher ${researcherId}`,
    })
    .eq("session_id", sessionId);
  if (consentError) {
    throw new Error(`Could not record withdrawal: ${consentError.message}`);
  }

  return {
    participantCode: session.participants.participant_code,
    deletedResponses: count ?? 0,
    withdrawnAt,
  };
}
