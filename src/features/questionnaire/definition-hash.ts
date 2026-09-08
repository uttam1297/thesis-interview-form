import { createHash } from "node:crypto";

import type { InterviewConfig } from "@/types/interview";

/**
 * Stable hash of a questionnaire definition. Used to detect that a version
 * already published for data collection has been edited in the repository,
 * which would silently break comparability of collected responses.
 */
export function hashDefinition(config: InterviewConfig): string {
  return createHash("sha256").update(stableStringify(config)).digest("hex");
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${JSON.stringify(k)}:${stableStringify(v)}`);
  return `{${entries.join(",")}}`;
}
