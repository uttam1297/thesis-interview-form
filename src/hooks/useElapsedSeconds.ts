import { useEffect, useState } from "react";

/** Counts whole seconds while `active` is true; resets to 0 when it flips. */
export function useElapsedSeconds(active: boolean): number {
  const [prevActive, setPrevActive] = useState(active);
  const [elapsed, setElapsed] = useState(0);

  // Reset synchronously during render when `active` changes, rather than in
  // an effect — see https://react.dev/learn/you-might-not-need-an-effect
  // ("Adjusting some state when a prop changes").
  if (active !== prevActive) {
    setPrevActive(active);
    setElapsed(0);
  }

  useEffect(() => {
    if (!active) return;

    const id = setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);

    return () => clearInterval(id);
  }, [active]);

  return elapsed;
}
