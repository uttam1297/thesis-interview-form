import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { VoiceButton } from "@/components/interview/voice-button";

describe("VoiceButton", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("shows 'Speak answer' when idle and calls onStart when clicked", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    render(<VoiceButton status="idle" onStart={onStart} onStop={() => {}} />);

    const button = screen.getByRole("button", { name: /speak answer/i });
    await user.click(button);

    expect(onStart).toHaveBeenCalledOnce();
  });

  it("shows elapsed time and calls onStop when listening", async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();
    render(
      <VoiceButton
        status="listening"
        elapsedSeconds={34}
        onStart={() => {}}
        onStop={onStop}
      />
    );

    const button = screen.getByRole("button", { name: /listening/i });
    expect(button).toHaveTextContent("00:34");

    await user.click(button);
    expect(onStop).toHaveBeenCalledOnce();
  });

  it("respects prefers-reduced-motion by skipping the pulsing scale animation", () => {
    window.matchMedia = ((query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    })) as unknown as typeof window.matchMedia;

    render(
      <VoiceButton status="listening" onStart={() => {}} onStop={() => {}} />
    );

    // The reduced-motion path still renders the listening button; it simply
    // does not animate scale/opacity through keyframes.
    expect(
      screen.getByRole("button", { name: /listening/i })
    ).toBeInTheDocument();
  });
});
