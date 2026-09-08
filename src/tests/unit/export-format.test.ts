import { describe, expect, it } from "vitest";

import { csvField, toCsv } from "@/features/admin/csv";

describe("CSV export formatting", () => {
  it("quotes fields containing commas, quotes or newlines", () => {
    expect(csvField("plain")).toBe("plain");
    expect(csvField("has, comma")).toBe('"has, comma"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField("line\nbreak")).toBe('"line\nbreak"');
    expect(csvField(null)).toBe("");
    expect(csvField(undefined)).toBe("");
  });

  it("keeps a free-text answer with commas in one field", () => {
    const csv = toCsv(
      ["participant", "response"],
      [["P001", "We check tickets, dashboards, then decide"]]
    );
    const dataLine = csv.trimEnd().split("\r\n")[1];
    expect(dataLine).toBe('P001,"We check tickets, dashboards, then decide"');
  });

  it("starts with a BOM so Excel reads UTF-8 correctly", () => {
    expect(toCsv(["a"], [["ü"]]).startsWith("﻿")).toBe(true);
  });
});
