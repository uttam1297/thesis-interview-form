/**
 * Provider-agnostic speech-to-text boundary. Question components only talk
 * to this interface, so a server-side transcription provider can be added
 * later without touching the UI.
 */

export type VoiceErrorCode =
  "permission-denied" | "no-speech" | "network" | "aborted" | "unknown";

export interface VoiceError {
  code: VoiceErrorCode;
  message: string;
}

export interface SpeechRecognitionHandlers {
  /** Called with recognised text. `isFinal` false = interim, may change. */
  onTranscript: (text: string, isFinal: boolean) => void;
  /** Microphone access granted and capture has actually begun. */
  onStart?: () => void;
  onError: (error: VoiceError) => void;
  /** Recognition stopped, whether by the user, an error, or silence. */
  onEnd: () => void;
}

export interface SpeechRecognitionAdapter {
  readonly isSupported: boolean;
  start(
    handlers: SpeechRecognitionHandlers,
    options?: { language?: string }
  ): void;
  stop(): void;
}

/** Adapter for environments without any recognition capability. */
export const unsupportedSpeechAdapter: SpeechRecognitionAdapter = {
  isSupported: false,
  start(handlers) {
    handlers.onError({
      code: "unknown",
      message: "Speech recognition is not available in this browser.",
    });
    handlers.onEnd();
  },
  stop() {},
};
