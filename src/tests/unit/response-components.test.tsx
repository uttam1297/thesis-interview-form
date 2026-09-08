import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LikertResponse } from "@/components/interview/responses/likert-response";
import { LongTextResponse } from "@/components/interview/responses/long-text-response";
import { MultiSelectResponse } from "@/components/interview/responses/multi-select-response";
import { RankingResponse } from "@/components/interview/responses/ranking-response";
import { ShortTextResponse } from "@/components/interview/responses/short-text-response";
import { SingleSelectResponse } from "@/components/interview/responses/single-select-response";
import { OTHER_VALUE } from "@/features/interview/validate-response";
import { testConfig } from "@/tests/fixtures/config";
import type { QuestionOfType, ResponseType } from "@/types/interview";

function q<T extends ResponseType>(id: string): QuestionOfType<T> {
  return testConfig.questions.find((x) => x.id === id) as QuestionOfType<T>;
}

describe("response components render by type and report values", () => {
  it("single_select reveals an Other field and reports both parts", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <SingleSelectResponse
        question={q("role")}
        value={null}
        onChange={onChange}
        labelId="l"
      />
    );

    await user.click(screen.getByRole("radio", { name: "Other" }));
    expect(onChange).toHaveBeenLastCalledWith(
      { kind: "single", value: OTHER_VALUE, other: undefined },
      "selected"
    );

    rerender(
      <SingleSelectResponse
        question={q("role")}
        value={{ kind: "single", value: OTHER_VALUE }}
        onChange={onChange}
        labelId="l"
      />
    );
    await user.type(screen.getByLabelText("Please specify"), "F");
    expect(onChange).toHaveBeenLastCalledWith(
      { kind: "single", value: OTHER_VALUE, other: "F" },
      "typed"
    );
  });

  it("multi_select reports the selected set and null when emptied", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { rerender } = render(
      <MultiSelectResponse
        question={q("tools")}
        value={null}
        onChange={onChange}
        labelId="l"
      />
    );
    await user.click(screen.getByRole("checkbox", { name: "Spreadsheets" }));
    expect(onChange).toHaveBeenLastCalledWith(
      { kind: "multi", values: ["sheets"], other: undefined },
      "selected"
    );

    rerender(
      <MultiSelectResponse
        question={q("tools")}
        value={{ kind: "multi", values: ["sheets"] }}
        onChange={onChange}
        labelId="l"
      />
    );
    await user.click(screen.getByRole("checkbox", { name: "Spreadsheets" }));
    expect(onChange).toHaveBeenLastCalledWith(null, "selected");
  });

  it("likert_scale reports a numeric value", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <LikertResponse
        question={q("confidence")}
        value={null}
        onChange={onChange}
        labelId="l"
      />
    );
    await user.click(screen.getByRole("radio", { name: "4" }));
    expect(onChange).toHaveBeenCalledWith(
      { kind: "scale", value: 4 },
      "selected"
    );
  });

  it("ranking materialises the default order and moves items with buttons", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <RankingResponse
        question={q("priorities")}
        value={null}
        onChange={onChange}
        labelId="l"
      />
    );
    expect(onChange).toHaveBeenCalledWith(
      { kind: "ranking", order: ["impact", "effort"] },
      "selected"
    );

    await user.click(screen.getByRole("button", { name: /Move Effort up/ }));
    expect(onChange).toHaveBeenLastCalledWith(
      { kind: "ranking", order: ["effort", "impact"] },
      "selected"
    );
    expect(
      screen.getByRole("button", { name: /Move Impact up/ })
    ).toBeDisabled();
  });

  it("short_text and long_text report typed text", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const shortQ = {
      ...q<"short_text">("closing"),
      responseType: "short_text" as const,
    };
    render(
      <ShortTextResponse
        question={shortQ}
        value={null}
        onChange={onChange}
        labelId="l"
      />
    );
    await user.type(screen.getByRole("textbox"), "a");
    expect(onChange).toHaveBeenLastCalledWith(
      { kind: "text", text: "a" },
      "typed"
    );

    const longQ = {
      ...q<"long_text">("closing"),
      responseType: "long_text" as const,
    };
    render(
      <LongTextResponse
        question={longQ}
        value={{ kind: "text", text: "x" }}
        onChange={onChange}
        labelId="l2"
      />
    );
    expect(screen.getByDisplayValue("x")).toBeInTheDocument();
  });
});
