import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Local Supabase connection details. These are the CLI's fixed development
 * keys, not secrets: `npx supabase start` prints the same values on every
 * machine.
 */
export const SUPABASE_URL = "http://127.0.0.1:54321";
export const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0";
export const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

export const RESEARCHER_EMAIL = "12uttamdarekar@gmail.com";
export const RESEARCHER_PASSWORD = "research-dev-password";

/** Anonymous client, exactly what an unauthenticated visitor could construct. */
export function anonClient() {
  return createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
  });
}

export function serviceClient() {
  return createClient<Database>(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

/** Signed-in researcher client; still subject to RLS. */
export async function researcherClient() {
  const client = createClient<Database>(SUPABASE_URL, ANON_KEY, {
    auth: { persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({
    email: RESEARCHER_EMAIL,
    password: RESEARCHER_PASSWORD,
  });
  if (error) throw new Error(`Researcher sign-in failed: ${error.message}`);
  return client;
}

/** True when the local stack is reachable, so tests can skip with a clear message. */
export async function databaseAvailable(): Promise<boolean> {
  try {
    const { error } = await serviceClient()
      .from("studies")
      .select("id")
      .limit(1);
    return !error;
  } catch {
    return false;
  }
}
