import { expect, type Page } from "@playwright/test";

export async function beginAndConsent(page: Page) {
  await page.goto("/interview");
  await page.getByRole("button", { name: "Begin" }).click();
  await page.getByRole("checkbox").click();
  await page.getByRole("button", { name: "Continue" }).click();
  // First section intro
  await expect(page.getByRole("heading", { name: "About you" })).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
}

export async function answerProfile(
  page: Page,
  aiFrequency: "Not yet" | "Daily"
) {
  await page.getByRole("radio", { name: "Product Manager" }).click();
  await continueStep(page);
  await page.getByRole("radio", { name: "6–10 years" }).click();
  await continueStep(page);
  await page.getByRole("radio", { name: "Software / SaaS" }).click();
  await continueStep(page);
  await page.getByRole("checkbox", { name: "B2B SaaS" }).click();
  await continueStep(page);
  await page.getByRole("radio", { name: "For most decisions" }).click();
  await continueStep(page);
  await page.getByRole("radio", { name: aiFrequency }).click();
  await continueStep(page);
}

export async function continueStep(page: Page) {
  await page.getByRole("button", { name: "Continue" }).click();
}

/** Answers the current open-ended question by typing. */
export async function typeAnswer(page: Page, text: string) {
  await page.getByRole("textbox").fill(text);
  await continueStep(page);
}
