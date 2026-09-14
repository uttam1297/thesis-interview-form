import legacyDefinition from "@/config/questions.json";
import { parseInterviewConfig } from "@/lib/validation/interview-config";
import type { InterviewConfig } from "@/types/interview";

/**
 * Immutable legacy questionnaire.
 *
 * Its production storage version is 2.4.0. Do not edit this definition or
 * reuse its question ids; existing sessions and responses depend on it.
 */
export const v1InterviewConfig: InterviewConfig =
  parseInterviewConfig(legacyDefinition);
