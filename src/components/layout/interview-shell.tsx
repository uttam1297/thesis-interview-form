import type { ReactNode } from "react";

interface InterviewShellProps {
  /** Optional progress row pinned to the top (omitted on welcome/consent/complete). */
  progress?: ReactNode;
  children: ReactNode;
  /** Optional Back/Continue row pinned to the bottom. */
  footer?: ReactNode;
}

/**
 * Shared chrome for every interview screen: a centered single column with
 * consistent padding, so individual pages only supply their content.
 */
export function InterviewShell({
  progress,
  children,
  footer,
}: InterviewShellProps) {
  return (
    <div className="flex min-h-dvh flex-col">
      {progress && (
        <div className="mx-auto w-full max-w-(--width-content) px-4 pt-6 sm:px-6 sm:pt-8">
          {progress}
        </div>
      )}
      <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="flex w-full max-w-(--width-content) justify-center">
          {children}
        </div>
      </main>
      {footer && (
        <div className="mx-auto w-full max-w-(--width-content) px-4 pb-6 sm:px-6 sm:pb-8">
          {footer}
        </div>
      )}
    </div>
  );
}
