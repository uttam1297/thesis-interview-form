import { v1InterviewConfig } from "@/config/questionnaires/v1";
import { v2InterviewConfig } from "@/config/questionnaires/v2";
import type { InterviewConfig } from "@/types/interview";

export const LEGACY_V1_STORAGE_VERSION = "2.4.0";
export const ACTIVE_QUESTIONNAIRE_VERSION = "v2";

export const questionnaireRegistry: Readonly<Record<string, InterviewConfig>> =
  {
    [LEGACY_V1_STORAGE_VERSION]: v1InterviewConfig,
    [ACTIVE_QUESTIONNAIRE_VERSION]: v2InterviewConfig,
  };

export function questionnaireLabel(version: string): "V1" | "V2" | string {
  if (version === LEGACY_V1_STORAGE_VERSION) return "V1";
  if (version === ACTIVE_QUESTIONNAIRE_VERSION) return "V2";
  return version;
}
