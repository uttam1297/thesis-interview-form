import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SingleSelectGroup } from "@/components/interview/single-select-group";

const options = [
  { value: "pm", label: "Product Manager" },
  { value: "ux", label: "UX Researcher" },
];

describe("SingleSelectGroup", () => {
  it("renders one radio per option with an accessible name", () => {
    render(<SingleSelectGroup name="role" options={options} />);

    expect(
      screen.getByRole("radio", { name: "Product Manager" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "UX Researcher" })
    ).toBeInTheDocument();
  });

  it("reports the selected value on click", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SingleSelectGroup
        name="role"
        options={options}
        onValueChange={onValueChange}
      />
    );

    await user.click(screen.getByRole("radio", { name: "UX Researcher" }));

    expect(onValueChange).toHaveBeenCalledWith("ux");
  });

  it("is operable via keyboard", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SingleSelectGroup
        name="role"
        options={options}
        onValueChange={onValueChange}
      />
    );

    await user.tab();
    expect(
      screen.getByRole("radio", { name: "Product Manager" })
    ).toHaveFocus();
    await user.keyboard("{ArrowDown}");

    expect(onValueChange).toHaveBeenCalledWith("ux");
  });
});
