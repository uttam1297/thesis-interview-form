import "server-only";

import { LEGACY_V1_STORAGE_VERSION } from "@/config/questionnaires";
import {
  getSession as getLegacySession,
  saveResponses as saveLegacyResponses,
  startSession as startLegacySession,
  submitSession as submitLegacySession,
  type ResponseUpsert,
  type SessionSnapshot,
} from "@/features/sessions/session-service";
import { SessionError } from "@/features/sessions/errors";
import {
  getV2Session,
  saveV2Responses,
  startV2Session,
  submitV2Session,
  type V2StudyStage,
} from "@/features/sessions/v2-session-service";
import type { Database } from "@/types/database";

type ResponseMode = Database["public"]["Enums"]["response_mode"];

export async function startSession(input: {
  questionnaireVersion?: string;
  consentVersion: string;
  participationConsent: boolean;
  recordingConsent: boolean | null;
  responseMode?: ResponseMode;
  studyStage?: V2StudyStage;
  createdBy?: string;
}): Promise<{ resumeToken: string; snapshot: SessionSnapshot }> {
  // A tab that loaded V1 before deployment may still reach consent afterwards.
  // Honour the exact definition it displayed instead of converting its answers.
  if (input.questionnaireVersion === LEGACY_V1_STORAGE_VERSION) {
    return startLegacySession(input);
  }
  if (input.questionnaireVersion && input.questionnaireVersion !== "v2") {
    throw new SessionError("version_mismatch", "Unknown questionnaire version");
  }
  return startV2Session(input);
}

async function routeExistingSession<T>(
  resumeToken: string,
  v2Operation: () => Promise<T>,
  legacyOperation: () => Promise<T>
): Promise<T> {
  if (!resumeToken.startsWith("v2_")) return legacyOperation();

  try {
    return await v2Operation();
  } catch (error) {
    // Legacy tokens predate the V2 prefix convention and are random base64url
    // strings. An old token can therefore begin with `v2_` by chance. Only an
    // unknown V2 token falls back; expiry, availability, and validation errors
    // must retain their real meaning.
    if (error instanceof SessionError && error.code === "invalid_token") {
      return legacyOperation();
    }
    throw error;
  }
}

export function getSession(resumeToken: string) {
  return routeExistingSession(
    resumeToken,
    () => getV2Session(resumeToken),
    () => getLegacySession(resumeToken)
  );
}

export function saveResponses(input: {
  resumeToken: string;
  responses: ResponseUpsert[];
  currentStepId?: string;
  returnToReview?: boolean;
}) {
  return routeExistingSession(
    input.resumeToken,
    () => saveV2Responses(input),
    () => saveLegacyResponses(input)
  );
}

export function submitSession(resumeToken: string) {
  return routeExistingSession(
    resumeToken,
    () => submitV2Session(resumeToken),
    () => submitLegacySession(resumeToken)
  );
}
