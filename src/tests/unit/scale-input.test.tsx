import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ScaleInput } from "@/components/interview/scale-input";

describe("ScaleInput", () => {
  it("renders one option per point in the range, plus end labels", () => {
    render(
      <ScaleInput
        name="confidence"
        min={1}
        max={5}
        minLabel="Not confident"
        maxLabel="Very confident"
      />
    );

    for (const point of [1, 2, 3, 4, 5]) {
      expect(
        screen.getByRole("radio", { name: String(point) })
      ).toBeInTheDocument();
    }
    expect(screen.getByText("Not confident")).toBeInTheDocument();
    expect(screen.getByText("Very confident")).toBeInTheDocument();
  });

  it("reports the selected point as a number", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <ScaleInput
        name="confidence"
        min={1}
        max={5}
        onValueChange={onValueChange}
      />
    );

    await user.click(screen.getByRole("radio", { name: "4" }));

    expect(onValueChange).toHaveBeenCalledWith(4);
  });
});
