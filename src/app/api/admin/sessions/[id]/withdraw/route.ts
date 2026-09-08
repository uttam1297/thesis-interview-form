import { NextResponse } from "next/server";
import { z } from "zod";

import { getResearcher } from "@/features/admin/auth";
import { withdrawSession } from "@/features/admin/withdrawal";

const withdrawSchema = z.object({
  /** Free text, e.g. "emailed 2026-09-14 quoting P014". Never the reason why. */
  note: z.string().max(500).optional(),
});

/**
 * Honours a withdrawal request: the participant's responses are deleted and
 * the session is marked withdrawn.
 *
 * Consent promises this, so it has to be a real action rather than a manual
 * database edit. It is irreversible by design — a withdrawal that leaves the
 * data recoverable is not a withdrawal.
 */
export async function POST(
  request: Request,
  { params }: RouteContext<"/api/admin/sessions/[id]/withdraw">
) {
  const researcher = await getResearcher();
  if (!researcher) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const parsed = withdrawSchema.safeParse(
    await request.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { id } = await params;
  try {
    const result = await withdrawSession({
      sessionId: id,
      researcherId: researcher.userId,
      note: parsed.data.note,
    });
    return NextResponse.json(result);
  } catch (error) {
    // The participant code is safe to log; response content is not.
    console.error(
      `[admin/withdraw] failed for session ${id}: ${
        error instanceof Error ? error.message : "unknown"
      }`
    );
    return NextResponse.json({ error: "withdrawal_failed" }, { status: 500 });
  }
}
