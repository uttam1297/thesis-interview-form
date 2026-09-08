"use client";

import { useState } from "react";

import { StatusMessage } from "@/components/feedback/status-message";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface SessionNotesProps {
  sessionId: string;
  notes: string | null;
}

/**
 * Researcher-only notes on a session — context that is not a participant
 * response, so it is stored on the session rather than mixed into the
 * research answers.
 */
export function SessionNotes({ sessionId, notes }: SessionNotesProps) {
  const [value, setValue] = useState(notes ?? "");
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );

  return (
    <section aria-labelledby="notes-heading" className="flex flex-col gap-2">
      <h2 id="notes-heading" className="text-sm font-medium">
        Researcher notes
      </h2>
      <Textarea
        rows={4}
        value={value}
        aria-label="Researcher notes"
        placeholder="Context, transcript reference, follow-up points…"
        onChange={(event) => {
          setValue(event.target.value);
          setState("idle");
        }}
      />
      <div className="flex items-center gap-3">
        <Button
          size="sm"
          disabled={state === "saving"}
          onClick={async () => {
            setState("saving");
            const response = await fetch(
              `/api/admin/sessions/${sessionId}/notes`,
              {
                method: "PATCH",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ notes: value }),
              }
            );
            setState(response.ok ? "saved" : "error");
          }}
        >
          {state === "saving" ? "Saving…" : "Save notes"}
        </Button>
        {state === "saved" && (
          <span className="text-xs text-muted-foreground">Saved</span>
        )}
      </div>
      {state === "error" && (
        <StatusMessage variant="warning">
          Notes could not be saved. Try again.
        </StatusMessage>
      )}
    </section>
  );
}
