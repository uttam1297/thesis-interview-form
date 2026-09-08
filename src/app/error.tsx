"use client";

import { useEffect } from "react";

import { StatusMessage } from "@/components/feedback/status-message";
import { Button } from "@/components/ui/button";

/**
 * Last-resort screen for an unexpected failure. It reassures the
 * participant that saved answers are safe and offers a way forward, without
 * exposing internal error details.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Digest only: never the message, which could contain response content.
    console.error(
      `[app] unhandled error${error.digest ? ` ${error.digest}` : ""}`
    );
  }, [error]);

  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="flex w-full max-w-(--width-content-narrow) flex-col items-center gap-6 text-center">
        <h1 className="text-xl font-medium sm:text-2xl">
          Something went wrong on our side
        </h1>
        <StatusMessage variant="warning">
          Your answers so far are saved on this device and, where possible, on
          our server. Nothing has been lost.
        </StatusMessage>
        <div className="flex flex-wrap justify-center gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button variant="ghost" render={<a href="/interview" />}>
            Back to the interview
          </Button>
        </div>
      </div>
    </main>
  );
}
