import { NextResponse } from "next/server";
import { z } from "zod";

import { getResearcher } from "@/features/admin/auth";
import { SessionError, sessionErrorStatus } from "@/features/sessions/errors";
import { startSession } from "@/features/sessions/session-service";

const createSchema = z.object({
  consentVersion: z.string().min(1),
  /** Confirmed verbally by the participant and recorded by the researcher. */
  participationConsent: z.literal(true),
  recordingConsent: z.boolean(),
});

/**
 * Creates a live-interview session. Same schema and same engine as the
 * asynchronous form; only response_mode, created_by and how consent was
 * obtained differ.
 */
export async function POST(request: Request) {
  const researcher = await getResearcher();
  if (!researcher) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const { resumeToken, snapshot } = await startSession({
      ...parsed.data,
      responseMode: "live_interview",
      createdBy: researcher.userId,
    });
    return NextResponse.json(
      { resumeToken, participantCode: snapshot.participantCode },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof SessionError) {
      return NextResponse.json(
        { error: error.code },
        { status: sessionErrorStatus[error.code] }
      );
    }
    console.error("[admin/live-sessions] create failed");
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
}
