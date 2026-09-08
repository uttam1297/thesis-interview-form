"use client";

import { AnimatePresence, motion } from "motion/react";

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
import { stepVariants, transitions } from "@/lib/motion";

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
      // The landing lays out two columns; every other step stays a single
      // reading column.
      wide={currentStep.kind === "welcome"}
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
      {/*
        Step transitions live here rather than in each screen, so every move
        through the interview reads the same: the current step leaves before
        the next arrives, which keeps the page from jumping. Keying by step
        id also remounts the screen, which is what moves focus to its
        heading.
      */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentStep.id}
          variants={stepVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={transitions.base}
          className="flex w-full justify-center"
        >
          {renderStep(currentStep)}
        </motion.div>
      </AnimatePresence>
    </InterviewShell>
  );
}
