import {
  Progress,
  ProgressLabel,
  ProgressTrack,
  ProgressIndicator as ProgressBar,
  ProgressValue,
} from "@/components/ui/progress";

interface ProgressIndicatorProps {
  /** 0–100. Shown as a percentage rather than "question N of M". */
  percent: number;
  label?: string;
}

export function ProgressIndicator({
  percent,
  label = "Progress",
}: ProgressIndicatorProps) {
  return (
    <Progress value={percent} className="gap-1.5">
      <div className="flex w-full justify-between">
        <ProgressLabel className="text-muted-foreground">{label}</ProgressLabel>
        <ProgressValue />
      </div>
      <ProgressTrack>
        <ProgressBar />
      </ProgressTrack>
    </Progress>
  );
}
