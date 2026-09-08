import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { InterviewRunner } from "@/components/interview/interview-runner";
import { InterviewProvider } from "@/features/interview/interview-provider";
import {
  MemoryDraftStorage,
  MemorySubmissionRepository,
} from "@/features/interview/persistence/memory";
import {
  unsupportedSpeechAdapter,
  type SpeechRecognitionAdapter,
} from "@/features/voice/adapter";
import { VoiceAdapterProvider } from "@/features/voice/voice-adapter-context";
import { fixedNow, testConfig } from "@/tests/fixtures/config";

function Harness({
  children,
  speechAdapter = unsupportedSpeechAdapter,
}: {
  children: ReactNode;
  speechAdapter?: SpeechRecognitionAdapter;
}) {
  return (
    <InterviewProvider
      config={testConfig}
      persistence={{
        drafts: new MemoryDraftStorage(),
        submissions: new MemorySubmissionRepository(),
      }}
      now={() => fixedNow}
    >
      <VoiceAdapterProvider adapter={speechAdapter}>
        {children}
      </VoiceAdapterProvider>
    </InterviewProvider>
  );
}

async function reachFirstQuestion(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    await screen.findByRole("button", { name: "Begin the interview" })
  );
  await user.click(
    await screen.findByRole("checkbox", { name: /agree to take part/i })
  );
  await user.click(await screen.findByRole("button", { name: "Continue" }));
  // Section intro.
  await user.click(await screen.findByRole("button", { name: "Continue" }));
  await screen.findByRole("heading", { name: "What is your role?" });
}

describe("question flow through the runner", () => {
  it("keeps the outgoing question layout stable at a section boundary", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <Harness>
        <InterviewRunner />
      </Harness>
    );
    await reachFirstQuestion(user);

    const contentWidth = () =>
      container.querySelector('[data-slot="interview-content-width"]');
    expect(contentWidth()).toHaveClass("max-w-5xl");

    await user.click(screen.getByRole("radio", { name: "Product Manager" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(await screen.findByRole("radio", { name: "Yes" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    expect(
      await screen.findByRole("heading", { name: "Core" })
    ).toBeInTheDocument();
    expect(contentWidth()).toHaveClass("max-w-5xl");

    const compactPath = container.querySelector(
      '[data-slot="compact-section-path"]'
    );
    expect(compactPath).toHaveClass("opacity-0");
    expect(compactPath).toHaveAttribute("aria-hidden", "true");
  });

  it("blocks Continue on a required question until answered, then advances", async () => {
    const user = userEvent.setup();
    render(
      <Harness>
        <InterviewRunner />
      </Harness>
    );
    await reachFirstQuestion(user);

    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(await screen.findByText(/needs an answer/i)).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "Product Manager" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    expect(
      await screen.findByRole("heading", { name: "Do you use AI tools?" })
    ).toBeInTheDocument();
  });

  it("moves focus to the new question heading on navigation", async () => {
    const user = userEvent.setup();
    render(
      <Harness>
        <InterviewRunner />
      </Harness>
    );
    await reachFirstQuestion(user);
    await waitFor(() =>
      expect(
        screen.getByRole("heading", { name: "What is your role?" })
      ).toHaveFocus()
    );
  });

  it("offers speech on open questions when the participant consented", async () => {
    const user = userEvent.setup();
    const speechAdapter: SpeechRecognitionAdapter = {
      isSupported: true,
      start() {},
      stop() {},
    };
    render(
      <Harness speechAdapter={speechAdapter}>
        <InterviewRunner />
      </Harness>
    );

    await user.click(
      await screen.findByRole("button", { name: "Begin the interview" })
    );
    await user.click(
      await screen.findByRole("checkbox", { name: /agree to take part/i })
    );
    await user.click(
      screen.getByRole("checkbox", { name: /option to speak my answers/i })
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await user.click(await screen.findByRole("button", { name: "Continue" }));
    await user.click(
      await screen.findByRole("radio", { name: "Product Manager" })
    );
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await user.click(await screen.findByRole("radio", { name: "Yes" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));

    await user.click(await screen.findByRole("button", { name: "Continue" }));
    expect(
      await screen.findByRole("heading", {
        name: "How do AI tools support you?",
      })
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("button", { name: /speak answer/i })
    ).toBeInTheDocument();
  });

  it("offers Skip on optional questions and Back restores the previous answer", async () => {
    const user = userEvent.setup();
    render(
      <Harness>
        <InterviewRunner />
      </Harness>
    );
    await reachFirstQuestion(user);

    await user.click(screen.getByRole("radio", { name: "Analyst" }));
    await user.click(screen.getByRole("button", { name: "Continue" }));
    await screen.findByRole("heading", { name: "Do you use AI tools?" });
    expect(
      screen.queryByRole("button", { name: "Skip for now" })
    ).not.toBeInTheDocument();

    await user.click(await screen.findByRole("button", { name: "Back" }));
    await screen.findByRole("heading", { name: "What is your role?" });
    expect(screen.getByRole("radio", { name: "Analyst" })).toBeChecked();
  });
});
