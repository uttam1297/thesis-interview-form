import { expect, test } from "@playwright/test";

import { beginAndConsent, continueStep } from "./helpers";

test("Flow B: answers survive a reload and the session resumes where it stopped", async ({
  page,
}) => {
  await beginAndConsent(page);
  await page.getByRole("radio", { name: "UX Researcher" }).click();
  await continueStep(page);
  await page.getByRole("radio", { name: "2–5 years" }).click();
  await continueStep(page);
  await expect(
    page.getByRole("heading", { name: /which industry/i })
  ).toBeVisible();

  // Give the debounced autosave a moment, then simulate closing the tab.
  await page.waitForTimeout(600);
  await page.reload();

  await expect(
    page.getByText("You have an unfinished session on this device.")
  ).toBeVisible();
  await page.getByRole("button", { name: "Continue previous session" }).click();

  await expect(
    page.getByRole("heading", { name: /which industry/i })
  ).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("radio", { name: "2–5 years" })).toBeChecked();
});

test("Flow B: Start over discards the saved session", async ({ page }) => {
  await beginAndConsent(page);
  await page.getByRole("radio", { name: "Product / Data Analyst" }).click();
  await continueStep(page);
  await page.waitForTimeout(600);
  await page.reload();

  await page.getByRole("button", { name: "Start over" }).click();
  await expect(page.getByRole("button", { name: "Begin" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("button", { name: "Begin" })).toBeVisible();
});
