import { NextResponse } from "next/server";
import { z } from "zod";

import { getResearcher } from "@/features/admin/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const notesSchema = z.object({
  notes: z.string().max(20000),
  source: z.enum(["v1", "v2"]).default("v1"),
});

export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/admin/sessions/[id]/notes">
) {
  const researcher = await getResearcher();
  if (!researcher) {
    return NextResponse.json({ error: "unauthorised" }, { status: 401 });
  }

  const parsed = notesSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { id } = await params;
  // Runs as the researcher, so the RLS update policy still applies.
  const supabase =
    parsed.data.source === "v2"
      ? createAdminClient()
      : await createServerSupabaseClient();
  const { error } = await supabase
    .from(parsed.data.source === "v2" ? "interview_v2_sessions" : "sessions")
    .update({ researcher_notes: parsed.data.notes })
    .eq("id", id);

  if (error) {
    console.error("[admin/notes] update failed");
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
