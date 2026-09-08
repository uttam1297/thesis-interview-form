import Image from "next/image";

import { study } from "@/config/study";
import { cn } from "@/lib/utils";

interface StudyHeaderProps {
  /** Also render the full thesis title beneath the logo. */
  showTitle?: boolean;
  className?: string;
}

/**
 * Institutional identity for landing screens: the HTW Berlin logo and, where
 * appropriate, the thesis title. The logo carries black wordmark text, so in
 * dark mode it sits on a white plate rather than being recoloured — an
 * institution's mark should not be altered.
 */
export function StudyHeader({
  showTitle = false,
  className,
}: StudyHeaderProps) {
  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      <div className="rounded-lg bg-white p-3 dark:ring-1 dark:ring-white/10">
        <Image
          src={study.logo.src}
          alt={study.logo.alt}
          width={study.logo.width}
          height={study.logo.height}
          priority
          className="h-16 w-auto sm:h-20"
        />
      </div>

      {showTitle && (
        <div className="flex flex-col items-center gap-2 text-center">
          <p className="text-sm tracking-wide text-muted-foreground uppercase">
            {study.programme}
          </p>
          <h1 className="max-w-2xl font-heading text-2xl leading-snug font-medium text-balance sm:text-3xl">
            {study.title}
          </h1>
        </div>
      )}
    </div>
  );
}
