import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProgressIndicator } from "@/components/interview/progress-indicator";

describe("ProgressIndicator", () => {
  it("shows the percentage rather than 'question N of M'", () => {
    render(<ProgressIndicator percent={45} />);

    expect(screen.getByText("Progress")).toBeInTheDocument();
    expect(screen.getByText("45%")).toBeInTheDocument();
    expect(screen.queryByText(/question \d+ of \d+/i)).not.toBeInTheDocument();
  });

  it("exposes the value on the underlying progressbar role", () => {
    render(<ProgressIndicator percent={45} />);

    const progressbar = screen.getByRole("progressbar");
    expect(progressbar).toHaveAttribute("aria-valuenow", "45");
  });
});
