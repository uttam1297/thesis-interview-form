import { NextResponse } from "next/server";
import { z } from "zod";

import { SessionError, sessionErrorStatus } from "@/features/sessions/errors";
import { startSession } from "@/features/sessions/session-service";

const startSchema = z.object({
  consentVersion: z.string().min(1),
  participationConsent: z.literal(true),
  recordingConsent: z.boolean().nullable().default(null),
});

/** Starts a new anonymous participant session once consent is given. */
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const parsed = startSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const { resumeToken, snapshot } = await startSession(parsed.data);
    return NextResponse.json({ resumeToken, snapshot }, { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}

export function errorResponse(error: unknown) {
  if (error instanceof SessionError) {
    // Log the code only: never the participant's answers.
    console.warn(`[sessions] ${error.code}`);
    return NextResponse.json(
      { error: error.code },
      { status: sessionErrorStatus[error.code] }
    );
  }
  console.error("[sessions] unexpected error");
  return NextResponse.json({ error: "unavailable" }, { status: 503 });
}
