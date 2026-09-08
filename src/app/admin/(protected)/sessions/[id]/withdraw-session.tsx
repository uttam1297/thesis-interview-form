"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { StatusMessage } from "@/components/feedback/status-message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WithdrawSessionProps {
  sessionId: string;
  participantCode: string;
  alreadyWithdrawn: boolean;
}

/**
 * Honours a withdrawal request. Consent promises participants that emailing
 * their code gets their responses deleted, so that has to be a real action
 * here rather than a manual database edit.
 *
 * Deliberately two steps: it cannot be undone.
 */
export function WithdrawSession({
  sessionId,
  participantCode,
  alreadyWithdrawn,
}: WithdrawSessionProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [note, setNote] = useState("");
  const [state, setState] = useState<"idle" | "working" | "error">("idle");

  if (alreadyWithdrawn) {
    return (
      <StatusMessage variant="info">
        This participant withdrew. Their responses have been deleted; the
        consent record is kept as evidence that consent was given and later
        withdrawn.
      </StatusMessage>
    );
  }

  return (
    <section aria-labelledby="withdraw-heading" className="flex flex-col gap-3">
      <h2 id="withdraw-heading" className="text-sm font-medium">
        Withdrawal request
      </h2>

      {!confirming ? (
        <div className="flex flex-col items-start gap-2">
          <p className="text-sm text-muted-foreground">
            Deletes every response {participantCode} gave. Use this when they
            ask, quoting their participant code.
          </p>
          <Button variant="outline" onClick={() => setConfirming(true)}>
            Withdraw {participantCode}
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 p-4">
          <p className="text-sm">
            This permanently deletes {participantCode}&apos;s responses. It
            cannot be undone, and anything already quoted in the thesis cannot
            be recalled.
          </p>
          <label className="flex flex-col gap-1 text-sm">
            <span className="text-muted-foreground">
              How the request arrived (optional)
            </span>
            <Input
              value={note}
              placeholder="e.g. emailed 14 September"
              onChange={(event) => setNote(event.target.value)}
            />
          </label>

          {state === "error" && (
            <StatusMessage variant="warning">
              The withdrawal did not complete. Nothing was changed — try again.
            </StatusMessage>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="destructive"
              disabled={state === "working"}
              onClick={async () => {
                setState("working");
                const response = await fetch(
                  `/api/admin/sessions/${sessionId}/withdraw`,
                  {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ note: note || undefined }),
                  }
                );
                if (!response.ok) {
                  setState("error");
                  return;
                }
                setConfirming(false);
                setState("idle");
                router.refresh();
              }}
            >
              {state === "working"
                ? "Deleting…"
                : "Delete responses permanently"}
            </Button>
            <Button
              variant="ghost"
              disabled={state === "working"}
              onClick={() => setConfirming(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
