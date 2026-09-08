import { CheckCircle2, Info, TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type StatusVariant = "info" | "success" | "warning";

interface StatusMessageProps {
  variant?: StatusVariant;
  children: ReactNode;
}

const variantStyles: Record<StatusVariant, string> = {
  info: "border-border bg-muted text-foreground",
  success: "border-primary/20 bg-primary/5 text-foreground",
  warning: "border-destructive/30 bg-destructive/5 text-foreground",
};

const variantIcons: Record<StatusVariant, ReactNode> = {
  info: <Info className="size-4 shrink-0 text-muted-foreground" />,
  success: <CheckCircle2 className="size-4 shrink-0 text-primary" />,
  warning: <TriangleAlert className="size-4 shrink-0 text-destructive" />,
};

/** Inline status banner for confirmations, autosave state, or warnings. */
export function StatusMessage({
  variant = "info",
  children,
}: StatusMessageProps) {
  return (
    <div
      role={variant === "warning" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm",
        variantStyles[variant]
      )}
    >
      {variantIcons[variant]}
      <span>{children}</span>
    </div>
  );
}
