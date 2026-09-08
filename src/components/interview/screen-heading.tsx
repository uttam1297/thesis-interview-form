"use client";

import { useEffect, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";

interface ScreenHeadingProps {
  id?: string;
  children: ReactNode;
  className?: string;
}

/**
 * The h1 of each screen. Programmatically focused on mount so keyboard and
 * screen-reader users land on the new content after every step change
 * instead of being left on a stale button.
 */
export function ScreenHeading({ id, children, className }: ScreenHeadingProps) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    ref.current?.focus({ preventScroll: false });
  }, []);

  return (
    <h1
      ref={ref}
      id={id}
      tabIndex={-1}
      className={cn(
        "font-heading text-2xl leading-snug font-medium text-balance outline-none sm:text-3xl",
        className
      )}
    >
      {children}
    </h1>
  );
}
