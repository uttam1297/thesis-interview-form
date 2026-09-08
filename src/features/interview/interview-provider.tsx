"use client";

import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import type { SyncStatus } from "@/features/interview/persistence/sync-queue";
import type { InterviewPersistence } from "@/features/interview/persistence/types";
import {
  calculateProgress,
  type Progress,
} from "@/features/interview/progress";
import {
  createInterviewReducer,
  type InterviewAction,
} from "@/features/interview/reducer";
import {
  createInitialState,
  type InterviewState,
} from "@/features/interview/state";
import {
  buildSteps,
  findStepIndex,
  type Step,
} from "@/features/interview/steps";
import { buildSubmission } from "@/features/interview/submission";
import type { InterviewConfig } from "@/types/interview";

const AUTOSAVE_DELAY_MS = 300;

export interface InterviewContextValue {
  config: InterviewConfig;
  state: InterviewState;
  steps: Step[];
  currentStep: Step;
  progress: Progress;
  /** A saved draft exists from a previous visit and has not been resumed yet. */
  pendingDraft: InterviewState | null;
  hydrated: boolean;
  dispatch: (action: DispatchableAction) => void;
  resumeDraft: () => void;
  discardDraft: () => void;
  submit: () => Promise<void>;
  submitError: string | null;
  submitting: boolean;
  /** Server persistence state; "idle" when persistence is local-only. */
  syncStatus: SyncStatus;
  retrySync: () => void;
  /** Present once a server session exists, for the "continue elsewhere" link. */
  resumeToken: string | null;
}

/** Actions the UI may dispatch; timestamps are stamped by the provider. */
export type DispatchableAction = DistributiveOmit<
  Exclude<InterviewAction, { type: "HYDRATE" } | { type: "SUBMIT_SUCCESS" }>,
  "now"
>;

type DistributiveOmit<T, K extends keyof T> = T extends unknown
  ? Omit<T, K>
  : never;

export const InterviewContext = createContext<InterviewContextValue | null>(
  null
);

interface InterviewProviderProps {
  config: InterviewConfig;
  persistence: InterviewPersistence;
  /**
   * Continue an existing session immediately instead of offering the
   * choice. Set when opening the session was already a deliberate act —
   * following a resume link, or a researcher opening a live interview.
   * A returning visitor on a shared device still gets the choice.
   */
  autoResume?: boolean;
  /** Injectable clock for deterministic tests. */
  now?: () => string;
  children: ReactNode;
}

export function InterviewProvider({
  config,
  persistence,
  autoResume = false,
  now = () => new Date().toISOString(),
  children,
}: InterviewProviderProps) {
  const reducer = useMemo(() => createInterviewReducer(config), [config]);
  const [state, rawDispatch] = useReducer(reducer, config.version, (version) =>
    createInitialState(version, now())
  );
  const [hydrated, setHydrated] = useState(false);
  const [pendingDraft, setPendingDraft] = useState<InterviewState | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The persistence layer is an external store; subscribe rather than
  // mirroring its state into an effect.
  const sync = persistence.sync;
  const syncStatus = useSyncExternalStore(
    useCallback(
      (onChange: () => void) => sync?.subscribe(onChange) ?? (() => {}),
      [sync]
    ),
    () => sync?.getStatus() ?? "idle",
    () => "idle" as SyncStatus
  );
  const resumeToken = useSyncExternalStore(
    useCallback(
      (onChange: () => void) => sync?.subscribe(onChange) ?? (() => {}),
      [sync]
    ),
    () => sync?.getResumeToken() ?? null,
    () => null
  );

  // Load any existing draft once on mount. Normally it is offered rather
  // than applied, so a returning visitor chooses between continuing and
  // starting over; autoResume skips that when the intent is unambiguous.
  useEffect(() => {
    let cancelled = false;
    persistence.drafts.load(config.version).then((draft) => {
      if (cancelled) return;
      if (draft?.status === "submitted") {
        // A finished session: show the closing screen rather than sending
        // the participant back to the welcome page.
        rawDispatch({ type: "HYDRATE", state: draft });
      } else if (draft && draft.status === "in_progress") {
        if (autoResume) rawDispatch({ type: "HYDRATE", state: draft });
        else setPendingDraft(draft);
      }
      setHydrated(true);
    });
    return () => {
      cancelled = true;
    };
  }, [persistence, config.version, autoResume]);

  // Debounced autosave of in-progress sessions.
  useEffect(() => {
    if (!hydrated || state.status !== "in_progress") return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      void persistence.drafts.save(state);
    }, AUTOSAVE_DELAY_MS);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state, hydrated, persistence]);

  const dispatch = useCallback(
    (action: DispatchableAction) => {
      rawDispatch({ ...action, now: now() } as InterviewAction);
    },
    [now]
  );

  const resumeDraft = useCallback(() => {
    if (!pendingDraft) return;
    rawDispatch({ type: "HYDRATE", state: pendingDraft });
    setPendingDraft(null);
  }, [pendingDraft]);

  const discardDraft = useCallback(() => {
    setPendingDraft(null);
    void persistence.drafts.clear();
    rawDispatch({ type: "RESET", now: now() });
  }, [persistence, now]);

  const submit = useCallback(async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const submittedAt = now();
      const submission = buildSubmission(config, state, submittedAt);
      const { participantRef } =
        await persistence.submissions.submit(submission);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      await persistence.drafts.clear();
      rawDispatch({ type: "SUBMIT_SUCCESS", participantRef, now: submittedAt });
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong while submitting."
      );
    } finally {
      setSubmitting(false);
    }
  }, [config, state, persistence, now]);

  const steps = useMemo(
    () => buildSteps(config, state.responses),
    [config, state.responses]
  );
  const currentIndex = findStepIndex(steps, state.currentStepId);
  const currentStep = steps[currentIndex === -1 ? 0 : currentIndex];
  const progress = useMemo(
    () => calculateProgress(steps, state.currentStepId),
    [steps, state.currentStepId]
  );

  const value: InterviewContextValue = {
    config,
    state,
    steps,
    currentStep,
    progress,
    pendingDraft,
    hydrated,
    dispatch,
    resumeDraft,
    discardDraft,
    submit,
    submitError,
    submitting,
    syncStatus,
    retrySync: () => persistence.sync?.retry(),
    resumeToken,
  };

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
}
