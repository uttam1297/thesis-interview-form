"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { LikertResponse } from "@/components/interview/responses/likert-response";
import { LongTextResponse } from "@/components/interview/responses/long-text-response";
import { MultiSelectResponse } from "@/components/interview/responses/multi-select-response";
import { ShortTextResponse } from "@/components/interview/responses/short-text-response";
import { SingleSelectResponse } from "@/components/interview/responses/single-select-response";
import type { ResponseComponentProps } from "@/components/interview/responses/types";
import type { ResponseType } from "@/types/interview";

// Voice (speech adapter + hook) and ranking are only needed on a few steps;
// load them on demand so they don't weigh on every question.
const VoiceTextResponse = dynamic(
  () =>
    import("@/components/interview/responses/voice-text-response").then(
      (m) => m.VoiceTextResponse
    ),
  { ssr: false }
);
const RankingResponse = dynamic(
  () =>
    import("@/components/interview/responses/ranking-response").then(
      (m) => m.RankingResponse
    ),
  { ssr: false }
);

/**
 * The single place that maps a response type to its component. Adding a
 * response type means adding an entry here — nowhere else switches on type.
 */
const registry: {
  [T in ResponseType]: ComponentType<ResponseComponentProps<T>>;
} = {
  single_select: SingleSelectResponse,
  multi_select: MultiSelectResponse,
  likert_scale: LikertResponse,
  ranking: RankingResponse,
  short_text: ShortTextResponse,
  long_text: LongTextResponse,
  // VoiceTextResponse accepts either voice-capable type; narrowing its input
  // to one member of that union is safe, TS only balks at class variance.
  voice_or_text: VoiceTextResponse as ComponentType<
    ResponseComponentProps<"voice_or_text">
  >,
  optional_elaboration: VoiceTextResponse as ComponentType<
    ResponseComponentProps<"optional_elaboration">
  >,
};

export function ResponseRenderer(props: ResponseComponentProps) {
  const Component = registry[
    props.question.responseType
  ] as ComponentType<ResponseComponentProps>;
  return <Component {...props} />;
}
