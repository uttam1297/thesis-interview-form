import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";

import { ConsentScreen } from "@/components/interview/screens/consent-screen";
import { InterviewProvider } from "@/features/interview/interview-provider";
import {
  MemoryDraftStorage,
  MemorySubmissionRepository,
} from "@/features/interview/persistence/memory";
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
      {children}
    </InterviewProvider>
  );
}

describe("ConsentScreen", () => {
  it("shows every consent point at a glance, without the full wording", () => {
    render(
      <Harness>
        <ConsentScreen />
      </Harness>
    );

    // Summaries are always visible.
    expect(screen.getByText(/One researcher sees your answers/i)).toBeVisible();
    expect(
      screen.getByText("Your answers are stored under a code.")
    ).toBeVisible();

    // The long wording is present for anyone who wants it, behind a
    // disclosure rather than filling the screen.
    expect(screen.getByText(/Read the full details/i)).toBeInTheDocument();
    expect(screen.getByText(/Art\. 6\(1\)\(a\) GDPR/)).toBeInTheDocument();
  });

  it("explains what the speech option does before asking for it", async () => {
    const user = userEvent.setup();
    render(
      <Harness>
        <ConsentScreen />
      </Harness>
    );

    const explainer = screen.getByRole("button", {
      name: /what does this do/i,
    });
    expect(explainer).toHaveAttribute("aria-expanded", "false");

    await user.click(explainer);

    expect(
      screen.getByText(/a “Speak answer” button appears/i)
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /hide explanation/i })
    ).toBeInTheDocument();
  });

  it("keeps Continue disabled until participation is agreed", async () => {
    const user = userEvent.setup();
    render(
      <Harness>
        <ConsentScreen />
      </Harness>
    );

    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    // Agreeing to speech alone must not unlock the interview.
    await user.click(
      screen.getByRole("checkbox", { name: /speak my answers/i })
    );
    expect(screen.getByRole("button", { name: "Continue" })).toBeDisabled();

    await user.click(
      screen.getByRole("checkbox", { name: /agree to take part/i })
    );
    expect(screen.getByRole("button", { name: "Continue" })).toBeEnabled();
  });
});
