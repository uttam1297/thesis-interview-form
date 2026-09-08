"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import type { SpeechRecognitionAdapter } from "@/features/voice/adapter";
import { createBrowserSpeechAdapter } from "@/features/voice/browser-speech-adapter";

const VoiceAdapterContext = createContext<SpeechRecognitionAdapter | null>(
  null
);

interface VoiceAdapterProviderProps {
  /** Override for tests or alternative providers; defaults to the browser API. */
  adapter?: SpeechRecognitionAdapter;
  children: ReactNode;
}

export function VoiceAdapterProvider({
  adapter,
  children,
}: VoiceAdapterProviderProps) {
  const value = useMemo(
    () => adapter ?? createBrowserSpeechAdapter(),
    [adapter]
  );
  return (
    <VoiceAdapterContext.Provider value={value}>
      {children}
    </VoiceAdapterContext.Provider>
  );
}

export function useSpeechAdapter(): SpeechRecognitionAdapter {
  const adapter = useContext(VoiceAdapterContext);
  if (!adapter)
    throw new Error(
      "useSpeechAdapter must be used within a VoiceAdapterProvider"
    );
  return adapter;
}
