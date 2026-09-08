import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InterviewShell } from "@/components/layout/interview-shell";

describe("InterviewShell", () => {
  it("keeps fixed footer actions at the bottom of the viewport", () => {
    const { container } = render(
      <InterviewShell fixedFooter={<button>Submit</button>}>
        <p>Review answers</p>
      </InterviewShell>
    );

    expect(screen.getByText("Review answers")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Submit" })).toBeInTheDocument();

    const footer = container.querySelector(
      '[data-slot="interview-fixed-footer"]'
    );
    expect(footer).toHaveClass("fixed", "bottom-0");
  });
});
