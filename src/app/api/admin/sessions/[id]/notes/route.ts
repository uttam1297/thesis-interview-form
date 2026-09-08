import { NextResponse } from "next/server";
import { z } from "zod";

import { getResearcher } from "@/features/admin/auth";
import { createServerSupabaseClient } from "@/lib/supabase/server";

const notesSchema = z.object({ notes: z.string().max(20000) });

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
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from("sessions")
    .update({ researcher_notes: parsed.data.notes })
    .eq("id", id);

  if (error) {
    console.error("[admin/notes] update failed");
    return NextResponse.json({ error: "update_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
