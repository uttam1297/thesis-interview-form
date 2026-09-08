import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AnswerConstellation } from "@/components/interview/answer-constellation";

describe("AnswerConstellation", () => {
  it("describes progress through the interview for screen readers", () => {
    render(<AnswerConstellation total={22} answered={9} currentIndex={9} />);

    expect(
      screen.getByRole("img", {
        name: "9 of 22 questions answered so far",
      })
    ).toBeInTheDocument();
  });

  it("draws one point per question", () => {
    const { container } = render(
      <AnswerConstellation total={6} answered={3} currentIndex={3} />
    );

    // Six points, the ring around the current one, and a fading halo on
    // each of the three answered points.
    expect(container.querySelectorAll("circle")).toHaveLength(6 + 1 + 3);
  });

  it("joins only the points that have been answered", () => {
    const { container } = render(
      <AnswerConstellation total={5} answered={3} currentIndex={3} />
    );

    // A join exists between every consecutive pair; the ones past the
    // answered point are drawn at zero length rather than removed.
    expect(container.querySelectorAll("line")).toHaveLength(4);
  });

  it("handles a section with a single question", () => {
    const { container } = render(
      <AnswerConstellation total={1} answered={0} currentIndex={0} />
    );

    expect(container.querySelectorAll("line")).toHaveLength(0);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
