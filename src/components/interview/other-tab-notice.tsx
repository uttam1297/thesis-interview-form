"use client";

import { StatusMessage } from "@/components/feedback/status-message";
import { Button } from "@/components/ui/button";

interface OtherTabNoticeProps {
  onReclaim: () => void;
}

/**
 * Shown when the same interview is open in another tab. Editing in two
 * places would let an older tab overwrite newer answers, so this tab pauses
 * until the participant chooses which one to continue in. Nothing already
 * answered is discarded.
 */
export function OtherTabNotice({ onReclaim }: OtherTabNoticeProps) {
  return (
    <div className="flex w-full max-w-(--width-content-narrow) flex-col gap-4">
      <StatusMessage variant="warning">
        This interview is open in another tab or window. To avoid answers
        overwriting each other, continue there — or take over here.
      </StatusMessage>
      <div>
        <Button variant="outline" onClick={onReclaim}>
          Continue in this tab
        </Button>
      </div>
    </div>
  );
}
