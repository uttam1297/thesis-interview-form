import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { MultiSelectGroup } from "@/components/interview/multi-select-group";

const options = [
  { value: "analytics", label: "Analytics platform" },
  { value: "sheets", label: "Spreadsheets" },
];

describe("MultiSelectGroup", () => {
  it("renders one checkbox per option", () => {
    render(<MultiSelectGroup name="tools" options={options} />);

    expect(
      screen.getByRole("checkbox", { name: "Analytics platform" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("checkbox", { name: "Spreadsheets" })
    ).toBeInTheDocument();
  });

  it("reports the full selected set, allowing more than one option", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <MultiSelectGroup
        name="tools"
        options={options}
        onValueChange={onValueChange}
      />
    );

    await user.click(
      screen.getByRole("checkbox", { name: "Analytics platform" })
    );
    expect(onValueChange).toHaveBeenLastCalledWith(["analytics"]);

    await user.click(screen.getByRole("checkbox", { name: "Spreadsheets" }));
    expect(onValueChange).toHaveBeenLastCalledWith(["analytics", "sheets"]);
  });
});
