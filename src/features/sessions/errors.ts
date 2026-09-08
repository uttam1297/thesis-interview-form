/**
 * Failure modes the participant API can return. The route handlers map
 * these to status codes and the UI maps them to explanatory screens, so a
 * participant never sees a bare error.
 */
export type SessionErrorCode =
  | "invalid_token"
  | "expired"
  | "already_completed"
  | "version_mismatch"
  | "not_found"
  | "unavailable";

export class SessionError extends Error {
  constructor(
    readonly code: SessionErrorCode,
    message: string
  ) {
    super(message);
    this.name = "SessionError";
  }
}

export const sessionErrorStatus: Record<SessionErrorCode, number> = {
  invalid_token: 401,
  expired: 410,
  already_completed: 409,
  version_mismatch: 409,
  not_found: 404,
  unavailable: 503,
};

export const sessionErrorMessages: Record<SessionErrorCode, string> = {
  invalid_token:
    "This link is not valid. Please use the most recent link you were given.",
  expired:
    "This link has expired. Contact the study team if you would like to continue.",
  already_completed: "This interview has already been submitted. Thank you.",
  version_mismatch:
    "The questionnaire has been updated since this session started, so it cannot be continued.",
  not_found: "We could not find this session.",
  unavailable:
    "We could not reach the server. Your answers are saved on this device.",
};
