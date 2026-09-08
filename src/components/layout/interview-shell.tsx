import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface InterviewShellProps {
  /** Landing screens use the full width for a two-column layout. */
  wide?: boolean;
  /** Optional progress row pinned to the top (omitted on welcome/consent/complete). */
  progress?: ReactNode;
  children: ReactNode;
  /** Optional Back/Continue row pinned to the bottom. */
  footer?: ReactNode;
  /** Optional action row kept visible above the bottom of the viewport. */
  fixedFooter?: ReactNode;
}

/**
 * Shared chrome for every interview screen: a centered single column with
 * consistent padding, so individual pages only supply their content.
 */
export function InterviewShell({
  progress,
  children,
  footer,
  fixedFooter,
  wide = false,
}: InterviewShellProps) {
  return (
    <div
      className={cn("relative flex min-h-dvh flex-col", fixedFooter && "pb-24")}
    >
      {wide && (
        <div
          aria-hidden="true"
          className="surface-grid pointer-events-none absolute inset-0 text-foreground"
        />
      )}
      <a
        href="#interview-content"
        className="sr-only rounded-lg bg-background px-4 py-2 text-sm font-medium ring-2 ring-ring focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50"
      >
        Skip to the question
      </a>
      {progress && (
        <div className="mx-auto w-full max-w-(--width-content) px-4 pt-6 sm:px-6 sm:pt-8">
          {progress}
        </div>
      )}
      <main
        id="interview-content"
        className="flex flex-1 items-center justify-center px-4 py-10 sm:px-6"
      >
        <div
          className={cn(
            "flex w-full justify-center",
            wide ? "max-w-5xl" : "max-w-(--width-content)"
          )}
        >
          {children}
        </div>
      </main>
      {footer && (
        <div className="mx-auto w-full max-w-(--width-content) px-4 pb-6 sm:px-6 sm:pb-8">
          {footer}
        </div>
      )}
      {fixedFooter && (
        <div
          data-slot="interview-fixed-footer"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-border/80 bg-background/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_-20px_color-mix(in_oklch,var(--foreground),transparent_55%)] backdrop-blur-sm sm:px-6"
        >
          <div className="mx-auto w-full max-w-(--width-content)">
            {fixedFooter}
          </div>
        </div>
      )}
    </div>
  );
}
