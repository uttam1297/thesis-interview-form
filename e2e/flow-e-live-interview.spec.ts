import { expect, test } from "@playwright/test";

import {
  chooseAndContinue,
  continueStep,
  signInAsResearcher,
  typeAnswer,
} from "./helpers";

test("Flow E: researcher records a live interview using the same questionnaire", async ({
  page,
}) => {
  await signInAsResearcher(page);
  await page.getByRole("link", { name: "Live interview" }).click();

  await expect(
    page.getByRole("heading", { name: "New live interview" })
  ).toBeVisible();
  // Consent cannot be skipped: the start button stays disabled until
  // participation consent is recorded.
  const start = page.getByRole("button", { name: "Start live interview" });
  await expect(start).toBeDisabled();

  await page.getByText(/agreed to take part and to anonymised use/i).click();
  // Recording consent is captured separately from participation.
  await page.getByText(/agreed to the call being recorded/i).click();
  await start.click();

  // The same engine, with dictation off for researcher entry.
  await expect(
    page.getByText(/Live interview · participant P\d{3}/)
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /speak answer/i })).toHaveCount(
    0
  );

  await continueStep(page); // section intro
  await chooseAndContinue(page, "Product Owner");
  await chooseAndContinue(page, "More than 10 years");
  await expect(
    page.getByRole("heading", { name: /which industry/i })
  ).toBeVisible();
  await chooseAndContinue(page, "Energy or industrial");
  await page
    .getByRole("checkbox", { name: "Internal platform or tooling" })
    .click();
  await continueStep(page);
  await chooseAndContinue(page, "Sometimes");
  await chooseAndContinue(page, "Occasionally");

  await continueStep(page); // How decisions happen intro
  await typeAnswer(page, "Decisions are made in a weekly steering meeting.");

  // Wait for the answers to reach the server before reading them back.
  await expect(page.getByText("Saved")).toBeVisible();

  // The live session appears in the dashboard alongside form responses.
  await page.goto("/admin");
  const liveRow = page.locator("tr", { hasText: "Live" }).first();
  await expect(liveRow).toBeVisible();

  // Collection mode is preserved in the export.
  const csv = await page.request.get("/api/admin/export?format=csv");
  const body = await csv.text();
  expect(body).toContain("live_interview");
  // Researcher-entered answers are attributed as such.
  expect(body).toContain("researcher");

  const long = await page.request.get("/api/admin/export?format=long");
  expect(await long.text()).toContain("live_interview");
});
