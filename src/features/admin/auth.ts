import "server-only";

import { redirect } from "next/navigation";

import { createServerSupabaseClient } from "@/lib/supabase/server";

export interface Researcher {
  userId: string;
  email: string;
  displayName: string | null;
}

/**
 * Server-side gate for every admin surface. Verifies the Supabase session
 * *and* researcher membership — being signed in is not sufficient.
 * Returns the researcher or redirects; never returns null.
 */
export async function requireResearcher(): Promise<Researcher> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/admin/login");

  const { data: profile } = await supabase
    .from("researcher_profiles")
    .select("user_id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/admin/login?error=not_a_researcher");

  return {
    userId: user.id,
    email: user.email ?? "",
    displayName: profile.display_name,
  };
}

/** Same check for route handlers, which return a response instead of redirecting. */
export async function getResearcher(): Promise<Researcher | null> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("researcher_profiles")
    .select("user_id, display_name")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
    displayName: profile.display_name,
  };
}
