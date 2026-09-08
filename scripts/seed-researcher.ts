/**
 * Creates the local researcher account and grants it researcher membership.
 *
 *   npm run db:seed-researcher
 *
 * Local development only. On a hosted project, create the account in the
 * Supabase dashboard and insert the researcher_profiles row deliberately —
 * membership is what grants access to every participant's data.
 */
import { createClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

const EMAIL = process.env.RESEARCHER_EMAIL ?? "12uttamdarekar@gmail.com";
const PASSWORD = process.env.RESEARCHER_PASSWORD ?? "research-dev-password";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
  }
  if (!url.includes("127.0.0.1") && !url.includes("localhost")) {
    throw new Error(
      "Refusing to seed a researcher account against a non-local Supabase URL."
    );
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: existing } = await supabase.auth.admin.listUsers();
  let userId = existing?.users.find((user) => user.email === EMAIL)?.id;

  if (!userId) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: EMAIL,
      password: PASSWORD,
      email_confirm: true,
    });
    if (error || !data.user) {
      throw new Error(`Could not create researcher: ${error?.message}`);
    }
    userId = data.user.id;
  }

  const { error: profileError } = await supabase
    .from("researcher_profiles")
    .upsert({ user_id: userId, display_name: "Researcher" }, { onConflict: "user_id" });
  if (profileError) {
    throw new Error(`Could not grant researcher access: ${profileError.message}`);
  }

  console.log(`Researcher ready: ${EMAIL}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
