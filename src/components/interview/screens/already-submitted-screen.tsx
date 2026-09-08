"use client";

import { CheckCircle2 } from "lucide-react";

import { ScreenHeading } from "@/components/interview/screen-heading";
import { study } from "@/config/study";
import { useInterview } from "@/features/interview/use-interview";

/**
 * Shown when a participant returns to a session they have already
 * submitted. Their answers are final, so this closes the loop rather than
 * offering a way back into the questionnaire.
 */
export function AlreadySubmittedScreen() {
  const { state } = useInterview();

  return (
    <div className="flex w-full max-w-(--width-content-narrow) flex-col items-center gap-6 text-center">
      <CheckCircle2 className="size-10 text-primary" aria-hidden="true" />
      <div className="flex flex-col gap-2">
        <ScreenHeading>You have already taken part.</ScreenHeading>
        <p className="text-sm text-muted-foreground">
          Your responses were submitted and cannot be changed. Thank you for
          your time.
        </p>
      </div>
      {state.participantRef && (
        <p className="text-sm">
          Your participant reference:{" "}
          <span className="font-medium tabular-nums">
            {state.participantRef}
          </span>
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        To withdraw your responses, email me your participant code at{" "}
        <a
          href={`mailto:${study.contactEmail}`}
          className="underline underline-offset-4 hover:text-foreground"
        >
          {study.contactEmail}
        </a>{" "}
        . I delete them on request, no reason needed.
      </p>
    </div>
  );
}
