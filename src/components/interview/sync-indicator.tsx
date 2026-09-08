"use client";

import { Check, CloudOff, Loader2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useInterview } from "@/features/interview/use-interview";

/**
 * Quiet save-state readout. Participants should be able to tell at a glance
 * that their answers are safe, and be told plainly when they are not.
 */
export function SyncIndicator() {
  const { syncStatus, retrySync } = useInterview();

  if (syncStatus === "idle") return null;

  if (syncStatus === "saving") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Loader2 className="size-3 animate-spin" aria-hidden="true" />
        Saving…
      </p>
    );
  }

  if (syncStatus === "saved") {
    return (
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Check className="size-3" aria-hidden="true" />
        Saved
      </p>
    );
  }

  const offline = syncStatus === "offline";
  return (
    <div role="status" className="flex flex-wrap items-center gap-2 text-xs">
      <span className="flex items-center gap-1.5 text-destructive">
        {offline ? (
          <CloudOff className="size-3" aria-hidden="true" />
        ) : (
          <TriangleAlert className="size-3" aria-hidden="true" />
        )}
        {offline
          ? "Offline — your answers are saved on this device"
          : "Could not save to the server — your answers are saved on this device"}
      </span>
      <Button
        variant="link"
        size="xs"
        className="h-auto p-0"
        onClick={retrySync}
      >
        Retry
      </Button>
    </div>
  );
}
