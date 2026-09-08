import {
  unsupportedSpeechAdapter,
  type SpeechRecognitionAdapter,
  type SpeechRecognitionHandlers,
  type VoiceErrorCode,
} from "@/features/voice/adapter";

/*
 * Minimal typings for the Web Speech API. TypeScript's DOM lib ships the
 * event types but not the constructor, and the API is still prefixed in
 * WebKit, so we declare only what this adapter uses.
 */
interface BrowserSpeechRecognitionResult {
  isFinal: boolean;
  0: { transcript: string };
}

interface BrowserSpeechRecognitionEvent {
  resultIndex: number;
  results: ArrayLike<BrowserSpeechRecognitionResult>;
}

interface BrowserSpeechRecognitionErrorEvent {
  error: string;
}

interface BrowserSpeechRecognition {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart: (() => void) | null;
  onresult: ((event: BrowserSpeechRecognitionEvent) => void) | null;
  onerror: ((event: BrowserSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

function getConstructor(): BrowserSpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function mapErrorCode(error: string): VoiceErrorCode {
  switch (error) {
    case "not-allowed":
    case "service-not-allowed":
      return "permission-denied";
    case "no-speech":
      return "no-speech";
    case "network":
      return "network";
    case "aborted":
      return "aborted";
    default:
      return "unknown";
  }
}

const errorMessages: Record<VoiceErrorCode, string> = {
  "permission-denied":
    "Microphone access was blocked. You can allow it in your browser settings, or type your answer instead.",
  "no-speech":
    "We didn't catch anything. Try again, or type your answer instead.",
  network:
    "Speech recognition needs a network connection. You can type your answer instead.",
  aborted: "Recording was interrupted.",
  unknown:
    "Speech recognition isn't working right now. You can type your answer instead.",
};

/**
 * Web Speech API adapter. Transcribes on-device/in-browser; no audio is
 * stored or sent by this application.
 */
export function createBrowserSpeechAdapter(): SpeechRecognitionAdapter {
  const Recognition = getConstructor();
  if (!Recognition) return unsupportedSpeechAdapter;

  let active: BrowserSpeechRecognition | null = null;

  return {
    isSupported: true,

    start(handlers: SpeechRecognitionHandlers, options) {
      if (active) active.abort();

      const recognition = new Recognition();
      recognition.lang = options?.language ?? "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;

      // Fires once permission is granted and audio capture starts.
      recognition.onstart = () => handlers.onStart?.();

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i += 1) {
          const result = event.results[i];
          handlers.onTranscript(result[0].transcript, result.isFinal);
        }
      };

      recognition.onerror = (event) => {
        const code = mapErrorCode(event.error);
        handlers.onError({ code, message: errorMessages[code] });
      };

      recognition.onend = () => {
        if (active === recognition) active = null;
        handlers.onEnd();
      };

      active = recognition;
      recognition.start();
    },

    stop() {
      active?.stop();
    },
  };
}
