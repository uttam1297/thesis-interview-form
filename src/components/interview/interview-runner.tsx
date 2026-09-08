"use client";

import { OtherTabNotice } from "@/components/interview/other-tab-notice";
import { ProgressIndicator } from "@/components/interview/progress-indicator";
import { ResumeLink } from "@/components/interview/resume-link";
import { SyncIndicator } from "@/components/interview/sync-indicator";
import { AlreadySubmittedScreen } from "@/components/interview/screens/already-submitted-screen";
import { CompleteScreen } from "@/components/interview/screens/complete-screen";
import { ConsentScreen } from "@/components/interview/screens/consent-screen";
import { QuestionScreen } from "@/components/interview/screens/question-screen";
import { ReviewScreen } from "@/components/interview/screens/review-screen";
import { SectionIntroScreen } from "@/components/interview/screens/section-intro-screen";
import { WelcomeScreen } from "@/components/interview/screens/welcome-screen";
import { InterviewShell } from "@/components/layout/interview-shell";
import type { Step } from "@/features/interview/steps";
import { useInterview } from "@/features/interview/use-interview";
import { useSessionLock } from "@/features/interview/use-session-lock";

function renderStep(step: Step) {
  switch (step.kind) {
    case "welcome":
      return <WelcomeScreen />;
    case "consent":
      return <ConsentScreen />;
    case "section-intro":
      return <SectionIntroScreen step={step} />;
    case "question":
      return <QuestionScreen step={step} />;
    case "review":
      return <ReviewScreen />;
    case "complete":
      return <CompleteScreen />;
  }
}

/** Routes the current engine step to its screen and wraps it in the shell. */
export function InterviewRunner() {
  const { currentStep, progress, state } = useInterview();
  // Only guard against a second tab while there are answers to protect.
  const { hasLock, reclaim } = useSessionLock(state.status === "in_progress");

  // A session restored as already submitted never re-enters the flow.
  if (state.status === "submitted" && currentStep.kind !== "complete") {
    return (
      <InterviewShell>
        <AlreadySubmittedScreen />
      </InterviewShell>
    );
  }

  if (!hasLock) {
    return (
      <InterviewShell>
        <OtherTabNotice onReclaim={reclaim} />
      </InterviewShell>
    );
  }
  const showProgress =
    currentStep.kind === "question" || currentStep.kind === "section-intro";
  const inProgress = state.status === "in_progress";

  return (
    <InterviewShell
      progress={
        showProgress ? (
          <div className="flex flex-col gap-1.5">
            <ProgressIndicator percent={progress.percent} />
            {/* Kept in view: participants should see saves without scrolling. */}
            <SyncIndicator />
          </div>
        ) : undefined
      }
      footer={inProgress ? <ResumeLink /> : undefined}
    >
      {/* Keyed so each step mounts fresh: entrance animation + heading focus. */}
      <div key={currentStep.id} className="flex w-full justify-center">
        {renderStep(currentStep)}
      </div>
    </InterviewShell>
  );
}
