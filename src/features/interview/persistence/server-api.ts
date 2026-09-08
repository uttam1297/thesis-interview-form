import type { SessionErrorCode } from "@/features/sessions/errors";
import type { InterviewConfig, ResponseRecord } from "@/types/interview";

/**
 * Typed browser-side wrapper over the participant API. The resume token
 * travels in a header rather than the URL so it does not end up in browser
 * history, referrers or server access logs.
 */

export class ApiError extends Error {
  constructor(
    readonly code: SessionErrorCode | "invalid_body" | "network",
    readonly status: number
  ) {
    super(code);
    this.name = "ApiError";
  }
}

export interface SessionSnapshotDto {
  participantCode: string;
  responseMode: "asynchronous_form" | "live_interview";
  status: "in_progress" | "completed" | "abandoned" | "withdrawn";
  questionnaireVersion: string;
  config: InterviewConfig;
  currentStepId: string;
  returnToReview: boolean;
  responses: Record<string, ResponseRecord>;
  consent: {
    version: string;
    participationConsent: boolean;
    recordingConsent: boolean | null;
    consentedAt: string;
  } | null;
  startedAt: string;
  completedAt: string | null;
}

async function parse<T>(response: Response): Promise<T> {
  if (response.ok) return (await response.json()) as T;
  let code: string = "unavailable";
  try {
    const body = (await response.json()) as { error?: string };
    if (body.error) code = body.error;
  } catch {
    // Non-JSON error body (proxy, gateway): keep the default code.
  }
  throw new ApiError(code as SessionErrorCode, response.status);
}

async function request<T>(input: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(input, init);
  } catch {
    // Offline or DNS failure: distinct from a server-side error.
    throw new ApiError("network", 0);
  }
  return parse<T>(response);
}

export const sessionApi = {
  start(input: {
    consentVersion: string;
    participationConsent: true;
    recordingConsent: boolean | null;
  }) {
    return request<{ resumeToken: string; snapshot: SessionSnapshotDto }>(
      "/api/sessions",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(input),
      }
    );
  },

  get(resumeToken: string) {
    return request<SessionSnapshotDto>("/api/sessions/current", {
      method: "GET",
      headers: { "x-resume-token": resumeToken },
      cache: "no-store",
    });
  },

  save(
    resumeToken: string,
    payload: {
      responses: Array<{
        questionKey: string;
        value: ResponseRecord["value"];
        skipped: boolean;
        method: ResponseRecord["method"];
        updatedAt: string;
      }>;
      currentStepId?: string;
      returnToReview?: boolean;
    }
  ) {
    return request<{ savedAt: string }>("/api/sessions/current", {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        "x-resume-token": resumeToken,
      },
      body: JSON.stringify(payload),
    });
  },

  submit(resumeToken: string) {
    return request<{ participantCode: string; completedAt: string }>(
      "/api/sessions/current/submit",
      { method: "POST", headers: { "x-resume-token": resumeToken } }
    );
  },
};
