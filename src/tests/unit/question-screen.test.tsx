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
import { unsupportedSpeechAdapter } from "@/features/voice/adapter";
import { VoiceAdapterProvider } from "@/features/voice/voice-adapter-context";
import { fixedNow, testConfig } from "@/tests/fixtures/config";

function Harness({ children }: { children: ReactNode }) {
  return (
    <InterviewProvider
      config={testConfig}
      persistence={{
        drafts: new MemoryDraftStorage(),
        submissions: new MemorySubmissionRepository(),
      }}
      now={() => fixedNow}
    >
      <VoiceAdapterProvider adapter={unsupportedSpeechAdapter}>
        {children}
      </VoiceAdapterProvider>
    </InterviewProvider>
  );
}

async function reachFirstQuestion(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    await screen.findByRole("button", { name: "Begin the interview" })
  );
  await user.click(await screen.findByRole("checkbox"));
  await user.click(await screen.findByRole("button", { name: "Continue" }));
  // Section intro.
  await user.click(await screen.findByRole("button", { name: "Continue" }));
  await screen.findByRole("heading", { name: "What is your role?" });
}

describe("question flow through the runner", () => {
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
