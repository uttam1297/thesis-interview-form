/** Publishes the isolated V2 definition and question rows in one transaction. */
import { createClient } from "@supabase/supabase-js";

import { v2InterviewConfig } from "@/config/questionnaires/v2";
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
  const questions = v2InterviewConfig.questions.map((question, position) => ({
    question_id: question.id,
    question_version: "1",
    position,
    section: question.sectionId,
    constructs: question.constructs ?? [question.construct],
    response_type: question.responseType,
    definition: question,
  }));

  const { error } = await supabase.rpc("publish_interview_v2_questionnaire", {
    p_study_slug: studySlug,
    p_definition: v2InterviewConfig as never,
    p_definition_hash: hashDefinition(v2InterviewConfig),
    p_questions: questions as never,
  });
  if (error)
    throw new Error(`Could not publish questionnaire V2: ${error.message}`);
  console.log(`Published questionnaire v2 with ${questions.length} questions.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
