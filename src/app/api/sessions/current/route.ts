import { NextResponse } from "next/server";
import { z } from "zod";

import { errorResponse } from "@/app/api/sessions/route";
import { getSession, saveResponses } from "@/features/sessions/session-service";

const responseValueSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("single"),
    value: z.string(),
    other: z.string().optional(),
  }),
  z.object({
    kind: z.literal("multi"),
    values: z.array(z.string()),
    other: z.string().optional(),
  }),
  z.object({ kind: z.literal("scale"), value: z.number() }),
  z.object({ kind: z.literal("ranking"), order: z.array(z.string()) }),
  z.object({ kind: z.literal("text"), text: z.string().max(20000) }),
]);

const saveSchema = z.object({
  responses: z
    .array(
      z.object({
        questionKey: z.string().min(1),
        value: responseValueSchema.nullable(),
        skipped: z.boolean(),
        method: z.enum(["selected", "typed", "voice", "researcher"]),
        updatedAt: z.string(),
      })
    )
    .max(100),
  currentStepId: z.string().optional(),
  returnToReview: z.boolean().optional(),
});

/** The resume token travels in a header, never in a logged query string. */
function tokenFrom(request: Request): string {
  return request.headers.get("x-resume-token") ?? "";
}

export async function GET(request: Request) {
  try {
    return NextResponse.json(await getSession(tokenFrom(request)));
  } catch (error) {
    return errorResponse(error);
  }
}

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const parsed = saveSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  try {
    const result = await saveResponses({
      resumeToken: tokenFrom(request),
      ...parsed.data,
    });
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
