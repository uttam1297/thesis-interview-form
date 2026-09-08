import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SectionPath } from "@/components/interview/section-path";

const sections = [
  { id: "profile", label: "About you" },
  { id: "decisions", label: "How decisions happen" },
  { id: "data-ai", label: "Data and AI" },
];

describe("SectionPath", () => {
  it("reports progress to assistive technology", () => {
    render(<SectionPath sections={sections} currentIndex={1} percent={45} />);

    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "45");
    expect(bar).toHaveAccessibleName(/section 2 of 3/i);
  });

  it("names the current section rather than a question count", () => {
    render(<SectionPath sections={sections} currentIndex={1} percent={45} />);

    expect(screen.getByText("How decisions happen")).toBeInTheDocument();
    expect(screen.getByText("45%")).toBeInTheDocument();
    expect(screen.queryByText(/question \d+ of \d+/i)).not.toBeInTheDocument();
  });

  it("shows position and section name in the full variant", () => {
    render(
      <SectionPath
        variant="full"
        sections={sections}
        currentIndex={2}
        percent={67}
      />
    );

    // The screen's own heading names the section, so the path shows only
    // position — repeating the name would say the same thing twice.
    expect(screen.getByText("Section 3 of 3")).toBeInTheDocument();
    expect(screen.queryByText("Data and AI")).not.toBeInTheDocument();
  });

  it("survives a single-section questionnaire", () => {
    render(
      <SectionPath
        sections={[{ id: "only", label: "Only section" }]}
        currentIndex={0}
        percent={100}
      />
    );

    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "100"
    );
  });
});
