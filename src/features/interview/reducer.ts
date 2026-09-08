import {
  createInitialState,
  type InterviewState,
} from "@/features/interview/state";
import {
  buildSteps,
  findStepIndex,
  stepIdForQuestion,
  type Step,
} from "@/features/interview/steps";
import type {
  InterviewConfig,
  ResponseMethod,
  ResponseValue,
} from "@/types/interview";

export type InterviewAction =
  | { type: "HYDRATE"; state: InterviewState }
  | { type: "START"; now: string }
  | { type: "ACCEPT_CONSENT"; consentVersion: string; now: string }
  | {
      type: "ANSWER";
      questionId: string;
      value: ResponseValue | null;
      method: ResponseMethod;
      now: string;
    }
  | { type: "SKIP"; questionId: string; now: string }
  | { type: "NEXT"; now: string }
  | { type: "BACK"; now: string }
  | {
      type: "GO_TO_QUESTION";
      questionId: string;
      fromReview: boolean;
      now: string;
    }
  | { type: "GO_TO_REVIEW"; now: string }
  | { type: "SUBMIT_SUCCESS"; participantRef: string; now: string }
  | { type: "RESET"; now: string };

/**
 * Pure interview state machine. Step ordering comes from buildSteps so the
 * reducer only ever moves along a list it recomputes from the latest
 * answers; it never deletes responses when moving backwards.
 */
export function createInterviewReducer(config: InterviewConfig) {
  const steps = (state: InterviewState): Step[] =>
    buildSteps(config, state.responses);

  const moveTo = (
    state: InterviewState,
    stepId: string,
    now: string
  ): InterviewState => ({
    ...state,
    currentStepId: stepId,
    updatedAt: now,
  });

  const stepAt = (state: InterviewState, offset: number): Step | undefined => {
    const list = steps(state);
    const index = findStepIndex(list, state.currentStepId);
    if (index === -1) return list[0];
    return list[index + offset];
  };

  return function interviewReducer(
    state: InterviewState,
    action: InterviewAction
  ): InterviewState {
    switch (action.type) {
      case "HYDRATE":
        return action.state;

      case "START":
        return {
          ...state,
          status: "in_progress",
          startedAt: state.startedAt ?? action.now,
          currentStepId: "consent",
          updatedAt: action.now,
        };

      case "ACCEPT_CONSENT": {
        const consented = {
          ...state,
          status: "in_progress" as const,
          startedAt: state.startedAt ?? action.now,
          consent: {
            accepted: true,
            version: action.consentVersion,
            acceptedAt: action.now,
          },
        };
        const next = stepAt(consented, 1);
        return moveTo(consented, next?.id ?? "review", action.now);
      }

      case "ANSWER":
        return {
          ...state,
          responses: {
            ...state.responses,
            [action.questionId]: {
              questionId: action.questionId,
              value: action.value,
              skipped: false,
              method: action.method,
              updatedAt: action.now,
            },
          },
          updatedAt: action.now,
        };

      case "SKIP": {
        const existing = state.responses[action.questionId];
        return {
          ...state,
          responses: {
            ...state.responses,
            [action.questionId]: {
              questionId: action.questionId,
              // Keep whatever was typed so coming back restores it.
              value: existing?.value ?? null,
              skipped: true,
              method: existing?.method ?? "selected",
              updatedAt: action.now,
            },
          },
          updatedAt: action.now,
        };
      }

      case "NEXT": {
        if (state.returnToReview) {
          return {
            ...moveTo(state, "review", action.now),
            returnToReview: false,
          };
        }
        const next = stepAt(state, 1);
        return next ? moveTo(state, next.id, action.now) : state;
      }

      case "BACK": {
        if (state.returnToReview) {
          return {
            ...moveTo(state, "review", action.now),
            returnToReview: false,
          };
        }
        const previous = stepAt(state, -1);
        // Never step back before consent once it has been accepted.
        if (
          !previous ||
          (state.consent?.accepted && previous.kind === "consent")
        ) {
          return state;
        }
        return moveTo(state, previous.id, action.now);
      }

      case "GO_TO_QUESTION":
        return {
          ...moveTo(state, stepIdForQuestion(action.questionId), action.now),
          returnToReview: action.fromReview,
        };

      case "GO_TO_REVIEW":
        return {
          ...moveTo(state, "review", action.now),
          returnToReview: false,
        };

      case "SUBMIT_SUCCESS":
        return {
          ...moveTo(state, "complete", action.now),
          status: "submitted",
          submittedAt: action.now,
          participantRef: action.participantRef,
        };

      case "RESET":
        return createInitialState(config.version, action.now);
    }
  };
}
