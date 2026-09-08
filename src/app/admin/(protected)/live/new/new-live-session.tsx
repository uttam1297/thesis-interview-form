"use client";

import { useRouter } from "next/navigation";
import { useId, useState } from "react";

import { StatusMessage } from "@/components/feedback/status-message";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";

/**
 * Opens a live-interview session. Consent is obtained verbally during the
 * call; the researcher records what the participant actually agreed to.
 * Participation and recording consent are captured separately — recording
 * consent is never inferred from agreeing to take part.
 */
export function NewLiveSession({ consentVersion }: { consentVersion: string }) {
  const router = useRouter();
  const participationId = useId();
  const recordingId = useId();
  const [participation, setParticipation] = useState(false);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="flex max-w-xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-medium">New live interview</h1>
        <p className="text-sm text-muted-foreground">
          Record the consent the participant gave verbally, then enter their
          answers using the same questionnaire as the online form.
        </p>
      </div>

      {error && <StatusMessage variant="warning">{error}</StatusMessage>}

      <div className="flex flex-col gap-3 rounded-lg border p-4">
        <p className="text-sm font-medium">
          Consent obtained ({consentVersion})
        </p>
        <FieldLabel htmlFor={participationId}>
          <Field orientation="horizontal">
            <Checkbox
              id={participationId}
              checked={participation}
              onCheckedChange={setParticipation}
            />
            <span className="text-sm">
              The participant agreed to take part and to anonymised use of their
              answers.
            </span>
          </Field>
        </FieldLabel>
        <FieldLabel htmlFor={recordingId}>
          <Field orientation="horizontal">
            <Checkbox
              id={recordingId}
              checked={recording}
              onCheckedChange={setRecording}
            />
            <span className="text-sm">
              The participant agreed to the call being recorded. Leave unticked
              if they declined or were not asked.
            </span>
          </Field>
        </FieldLabel>
      </div>

      <StatusMessage variant="info">
        No audio is stored by this application. Any recording is handled outside
        it, under the study&apos;s approved procedure.
      </StatusMessage>

      <div>
        <Button
          disabled={!participation || pending}
          onClick={async () => {
            setPending(true);
            setError(null);
            try {
              const response = await fetch("/api/admin/live-sessions", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({
                  consentVersion,
                  participationConsent: true,
                  recordingConsent: recording,
                }),
              });
              if (!response.ok) throw new Error("create_failed");
              const { resumeToken } = (await response.json()) as {
                resumeToken: string;
              };
              router.push(`/admin/live/${encodeURIComponent(resumeToken)}`);
            } catch {
              setPending(false);
              setError("The session could not be created. Try again.");
            }
          }}
        >
          {pending ? "Creating…" : "Start live interview"}
        </Button>
      </div>
    </div>
  );
}
