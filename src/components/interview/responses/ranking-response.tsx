"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useEffect } from "react";

import type { ResponseComponentProps } from "@/components/interview/responses/types";
import { IconButton } from "@/components/ui/icon-button";

/**
 * Ranking via move-up/move-down buttons: fully keyboard-operable and works
 * on touch without a drag-and-drop dependency.
 */
export function RankingResponse({
  question,
  value,
  onChange,
  labelId,
}: ResponseComponentProps<"ranking">) {
  const defaultOrder = question.options.map((o) => o.value);
  const order = value?.kind === "ranking" ? value.order : defaultOrder;

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
  };

  return (
    <ol aria-labelledby={labelId} className="flex flex-col gap-2">
      {order.map((optionValue, index) => (
        <li
          key={optionValue}
          className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2"
        >
          <span className="w-5 shrink-0 text-sm text-muted-foreground tabular-nums">
            {index + 1}
          </span>
          <span className="flex-1 text-sm">{labelFor(optionValue)}</span>
          <div className="flex shrink-0 gap-1">
            <IconButton
              aria-label={`Move ${labelFor(optionValue)} up`}
              variant="outline"
              size="icon-sm"
              disabled={index === 0}
              onClick={() => move(index, -1)}
            >
              <ArrowUp />
            </IconButton>
            <IconButton
              aria-label={`Move ${labelFor(optionValue)} down`}
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
  );
}
