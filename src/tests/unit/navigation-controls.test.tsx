import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NavigationControls } from "@/components/interview/navigation-controls";

describe("NavigationControls", () => {
  it("omits Back and Skip when no handler is given", () => {
    render(<NavigationControls onContinue={() => {}} />);

    expect(
      screen.queryByRole("button", { name: "Back" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Skip for now" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Continue" })
    ).toBeInTheDocument();
  });

  it("disables Continue when continueDisabled is true", async () => {
    const user = userEvent.setup();
    const onContinue = vi.fn();
    render(<NavigationControls onContinue={onContinue} continueDisabled />);

    const continueButton = screen.getByRole("button", { name: "Continue" });
    expect(continueButton).toBeDisabled();

    await user.click(continueButton);
    expect(onContinue).not.toHaveBeenCalled();
  });

  it("invokes onBack and onSkip when provided", async () => {
    const user = userEvent.setup();
    const onBack = vi.fn();
    const onSkip = vi.fn();
    render(
      <NavigationControls
        onBack={onBack}
        onContinue={() => {}}
        onSkip={onSkip}
      />
    );

    await user.click(screen.getByRole("button", { name: "Back" }));
    await user.click(screen.getByRole("button", { name: "Skip for now" }));

    expect(onBack).toHaveBeenCalledOnce();
    expect(onSkip).toHaveBeenCalledOnce();
  });
});
