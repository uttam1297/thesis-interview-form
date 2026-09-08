import { NextResponse } from "next/server";

import { errorResponse } from "@/app/api/sessions/route";
import { submitSession } from "@/features/sessions/session-service";

export async function POST(request: Request) {
  try {
    const result = await submitSession(
      request.headers.get("x-resume-token") ?? ""
    );
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}
