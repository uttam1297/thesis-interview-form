import { act, render, renderHook, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { VoiceTextResponse } from "@/components/interview/responses/voice-text-response";
import {
  unsupportedSpeechAdapter,
  type SpeechRecognitionAdapter,
  type SpeechRecognitionHandlers,
} from "@/features/voice/adapter";
import { useVoiceInput } from "@/features/voice/use-voice-input";
import { VoiceAdapterProvider } from "@/features/voice/voice-adapter-context";
import { testConfig } from "@/tests/fixtures/config";
import type { QuestionOfType } from "@/types/interview";

/** Scriptable adapter so tests can drive recognition events by hand. */
function createFakeAdapter(): SpeechRecognitionAdapter & {
  handlers: SpeechRecognitionHandlers | null;
} {
  return {
    isSupported: true,
    handlers: null,
    start(handlers) {
      this.handlers = handlers;
    },
    stop() {
      this.handlers?.onEnd();
      this.handlers = null;
    },
  };
}

const question = testConfig.questions.find(
  (q) => q.id === "ai-how"
) as QuestionOfType<"voice_or_text">;

describe("useVoiceInput", () => {
  it("reports unsupported when the adapter has no capability", () => {
    const { result } = renderHook(() =>
      useVoiceInput({
        adapter: unsupportedSpeechAdapter,
        onFinalTranscript: () => {},
      })
    );
    expect(result.current.status).toBe("unsupported");
    act(() => result.current.start());
    expect(result.current.status).toBe("unsupported");
  });

  it("walks idle → listening → idle and forwards final transcripts", () => {
    const adapter = createFakeAdapter();
    const onFinal = vi.fn();
    const { result } = renderHook(() =>
      useVoiceInput({ adapter, onFinalTranscript: onFinal })
    );

    act(() => result.current.start());
    expect(result.current.status).toBe("listening");

    act(() => adapter.handlers?.onTranscript("hello wor", false));
    expect(result.current.interimTranscript).toBe("hello wor");

    act(() => adapter.handlers?.onTranscript("hello world", true));
    expect(onFinal).toHaveBeenCalledWith("hello world");
    expect(result.current.interimTranscript).toBe("");

    act(() => result.current.stop());
    expect(result.current.status).toBe("idle");
  });

  it("surfaces permission errors", () => {
    const adapter = createFakeAdapter();
    const { result } = renderHook(() =>
      useVoiceInput({ adapter, onFinalTranscript: () => {} })
    );
    act(() => result.current.start());
    act(() =>
      adapter.handlers?.onError({
        code: "permission-denied",
        message: "Mic blocked",
      })
    );
    act(() => adapter.handlers?.onEnd());
    expect(result.current.status).toBe("error");
    expect(result.current.error?.code).toBe("permission-denied");
  });
});

describe("VoiceTextResponse", () => {
  it("falls back to typing when speech recognition is unsupported", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <VoiceAdapterProvider adapter={unsupportedSpeechAdapter}>
        <VoiceTextResponse
          question={question}
          value={null}
          onChange={onChange}
          labelId="l"
        />
      </VoiceAdapterProvider>
    );

    expect(
      screen.queryByRole("button", { name: /speak answer/i })
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/isn't available in this browser/i)
    ).toBeInTheDocument();

    await user.type(screen.getByRole("textbox"), "t");
    expect(onChange).toHaveBeenLastCalledWith(
      { kind: "text", text: "t" },
      "typed"
    );
  });

  it("appends dictated phrases into the editable text as a voice answer", async () => {
    const user = userEvent.setup();
    const adapter = createFakeAdapter();
    const onChange = vi.fn();
    render(
      <VoiceAdapterProvider adapter={adapter}>
        <VoiceTextResponse
          question={question}
          value={{ kind: "text", text: "Already typed" }}
          onChange={onChange}
          labelId="l"
        />
      </VoiceAdapterProvider>
    );

    await user.click(screen.getByRole("button", { name: /speak answer/i }));
    expect(
      screen.getByRole("button", { name: /listening/i })
    ).toBeInTheDocument();

    act(() => adapter.handlers?.onTranscript("and dictated", true));
    expect(onChange).toHaveBeenLastCalledWith(
      { kind: "text", text: "Already typed and dictated" },
      "voice"
    );
  });
});
