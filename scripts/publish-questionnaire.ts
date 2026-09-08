/**
 * Publishes src/config/interview.ts to the database as an immutable
 * questionnaire version.
 *
 *   npm run questionnaire:publish
 *
 * Publishing the same version twice is a no-op when the definition is
 * unchanged, and an error when it differs: collected responses point at
 * question rows, so editing a published version would silently change what
 * participants are recorded as having answered. Bump `version` in the
 * config instead.
 */
import { createClient } from "@supabase/supabase-js";

import { interviewConfig } from "@/config/interview";
import { hashDefinition } from "@/features/questionnaire/definition-hash";
import type { Database } from "@/types/database";

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const studySlug = process.env.STUDY_SLUG;
  if (!url || !serviceKey || !studySlug) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and STUDY_SLUG must be set"
    );
  }

  const supabase = createClient<Database>(url, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: study, error: studyError } = await supabase
    .from("studies")
    .select("id, slug")
    .eq("slug", studySlug)
    .single();
  if (studyError || !study) {
    throw new Error(`Study "${studySlug}" not found. Run the seed first.`);
  }

  const definitionHash = hashDefinition(interviewConfig);

  const { data: existing } = await supabase
    .from("questionnaire_versions")
    .select("id, definition_hash")
    .eq("study_id", study.id)
    .eq("version", interviewConfig.version)
    .maybeSingle();

  if (existing) {
    if (existing.definition_hash === definitionHash) {
      console.log(
        `Version ${interviewConfig.version} already published and unchanged.`
      );
      return;
    }
    throw new Error(
      `Version ${interviewConfig.version} is already published with different content.\n` +
        "Responses are tied to its question rows, so it cannot be edited in place.\n" +
        "Bump `version` in src/config/interview.ts to publish a new version."
    );
  }

  const { data: version, error: versionError } = await supabase
    .from("questionnaire_versions")
    .insert({
      study_id: study.id,
      version: interviewConfig.version,
      definition:
        interviewConfig as unknown as Database["public"]["Tables"]["questionnaire_versions"]["Insert"]["definition"],
      definition_hash: definitionHash,
    })
    .select("id")
    .single();
  if (versionError || !version) {
    throw new Error(`Could not create version: ${versionError?.message}`);
  }

  const rows = interviewConfig.questions.map((question, index) => ({
    questionnaire_version_id: version.id,
    question_key: question.id,
    position: index,
    section_id: question.sectionId,
    construct: question.construct,
    response_type: question.responseType,
    definition:
      question as unknown as Database["public"]["Tables"]["questionnaire_questions"]["Insert"]["definition"],
  }));

  const { error: questionsError } = await supabase
    .from("questionnaire_questions")
    .insert(rows);
  if (questionsError) {
    throw new Error(`Could not insert questions: ${questionsError.message}`);
  }

  console.log(
    `Published questionnaire ${interviewConfig.version} with ${rows.length} questions.`
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
