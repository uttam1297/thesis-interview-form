"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";

import type { ResponseComponentProps } from "@/components/interview/responses/types";
import { IconButton } from "@/components/ui/icon-button";

/**
 * Ranking via move-up/move-down buttons: fully keyboard-operable and works
 * on touch without a drag-and-drop dependency.
 *
 * The two ends of the scale are labelled, and moves are announced, because
 * the hardest part of a ranking question is knowing which end means "most".
 */
export function RankingResponse({
  question,
  value,
  onChange,
  labelId,
}: ResponseComponentProps<"ranking">) {
  const defaultOrder = question.options.map((o) => o.value);
  const order = value?.kind === "ranking" ? value.order : defaultOrder;
  const [announcement, setAnnouncement] = useState("");

  // An untouched list is still a valid ranking (the participant accepts the
  // shown order), so materialise it as an answer once.
  useEffect(() => {
    if (value === null)
      onChange({ kind: "ranking", order: defaultOrder }, "selected");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount only
  }, []);

  const labelFor = (optionValue: string) =>
    question.options.find((o) => o.value === optionValue)?.label ?? optionValue;

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    onChange({ kind: "ranking", order: next }, "selected");
    setAnnouncement(
      `${labelFor(order[index])} moved to position ${target + 1} of ${next.length}`
    );
  };

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">Carries the most weight</p>

      <ol aria-labelledby={labelId} className="flex flex-col gap-2">
        {order.map((optionValue, index) => (
          <li
            key={optionValue}
            className="flex min-h-14 items-center gap-3 rounded-lg border bg-background px-3 py-2"
          >
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-sm font-medium tabular-nums">
              {index + 1}
            </span>
            <span className="flex-1">{labelFor(optionValue)}</span>
            <div className="flex shrink-0 gap-1">
              <IconButton
                aria-label={`Move ${labelFor(optionValue)} up, to position ${index}`}
                variant="outline"
                size="icon-sm"
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                <ArrowUp />
              </IconButton>
              <IconButton
                aria-label={`Move ${labelFor(optionValue)} down, to position ${index + 2}`}
                variant="outline"
                size="icon-sm"
                disabled={index === order.length - 1}
                onClick={() => move(index, 1)}
              >
                <ArrowDown />
              </IconButton>
            </div>
          </li>
        ))}
      </ol>

      <p className="text-sm font-medium">Carries the least weight</p>

      {/* Reordering is a visual change; announce it for screen readers. */}
      <span role="status" aria-live="polite" className="sr-only">
        {announcement}
      </span>
    </div>
  );
}
