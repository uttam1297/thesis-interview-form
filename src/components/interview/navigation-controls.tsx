import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

interface NavigationControlsProps {
  onBack?: () => void;
  backLabel?: string;
  onContinue?: () => void;
  continueLabel?: string;
  continueDisabled?: boolean;
  onSkip?: () => void;
  skipLabel?: string;
}

/** Back / Continue / optional Skip row for a single question step. */
export function NavigationControls({
  onBack,
  backLabel = "Back",
  onContinue,
  continueLabel = "Continue",
  continueDisabled,
  onSkip,
  skipLabel = "Skip for now",
}: NavigationControlsProps) {
  return (
    <div className="flex w-full items-center justify-between gap-4">
      <div>
        {onBack && (
          <Button type="button" variant="ghost" onClick={onBack}>
            <ArrowLeft className="size-4" />
            {backLabel}
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {onSkip && (
          <Button type="button" variant="ghost" onClick={onSkip}>
            {skipLabel}
          </Button>
        )}
        {onContinue && (
          <Button
            type="button"
            onClick={onContinue}
            disabled={continueDisabled}
          >
            {continueLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
