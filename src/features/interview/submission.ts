import type { InterviewState } from "@/features/interview/state";
import type { InterviewConfig, ResponseRecord } from "@/types/interview";

/**
 * The research record produced when a participant submits. Shaped for the
 * dataset rather than the UI: every response carries its construct and
 * section so exports (Phase 3) need no joins against config.
 */
export interface SubmittedResponse extends ResponseRecord {
  construct: string;
  sectionId: string;
  responseType: string;
}

export interface InterviewSubmission {
  configVersion: string;
  responseMode: "asynchronous_form";
  consent: NonNullable<InterviewState["consent"]>;
  startedAt: string | null;
  submittedAt: string;
  responses: SubmittedResponse[];
}

export function buildSubmission(
  config: InterviewConfig,
  state: InterviewState,
  submittedAt: string
): InterviewSubmission {
  if (!state.consent?.accepted) {
    throw new Error("Cannot build a submission without accepted consent");
  }

  const responses = config.questions.flatMap<SubmittedResponse>((question) => {
    const record = state.responses[question.id];
    if (!record) return [];
    return [
      {
        ...record,
        construct: question.construct,
        sectionId: question.sectionId,
        responseType: question.responseType,
      },
    ];
  });

  return {
    configVersion: config.version,
    responseMode: "asynchronous_form",
    consent: state.consent,
    startedAt: state.startedAt,
    submittedAt,
    responses,
  };
}
