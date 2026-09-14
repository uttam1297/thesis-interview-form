import { expect, type Page } from "@playwright/test";

export const RESEARCHER_EMAIL = "12uttamdarekar@gmail.com";
export const RESEARCHER_PASSWORD = "research-dev-password";

/** Answers a single-select question and moves on. */
export async function chooseAndContinue(page: Page, option: string | RegExp) {
  await page.getByRole("radio", { name: option }).click();
  await continueStep(page);
}

export async function continueStep(page: Page) {
  await page.getByRole("button", { name: "Continue" }).first().click();
  await settle(page);
}

/**
 * Steps animate out before the next one mounts, so a locator resolved
 * immediately after Continue can still match the leaving screen. Waiting for
 * the transition keeps the helpers acting on the screen a participant would
 * actually be looking at.
 */
export async function settle(page: Page) {
  await page.waitForTimeout(400);
}

/**
 * Saving is debounced, so "Saved" on screen can still be reporting the
 * previous answer. Tests that read data back from the server have to wait
 * for the last one to actually land.
 */
export async function waitForSaved(page: Page) {
  await page.waitForTimeout(1200);
  await expect(page.getByText("Saved")).toBeVisible();
}

export async function typeAnswer(page: Page, text: string) {
  await page.getByRole("textbox").first().fill(text);
  await continueStep(page);
}

/** Walks welcome → consent → first V2 profile question. */
export async function beginAndConsent(page: Page) {
  await page.goto("/interview");
  await page.getByRole("button", { name: "Begin the interview" }).click();
  // Participation consent; speech-to-text is a separate, optional box.
  await page.getByRole("checkbox", { name: /agree to take part/i }).click();
  await continueStep(page);
  await expect(
    page.getByRole("heading", {
      name: "Which best describes your current role?",
    })
  ).toBeVisible();
}

/** Answers the four V2 profile questions. */
export async function answerProfile(page: Page) {
  await chooseAndContinue(page, "Product / Product Owner");
  await chooseAndContinue(page, "6–10 years");
  await chooseAndContinue(page, "Software / SaaS");
  await chooseAndContinue(page, "I make or own the decision");
}

/**
 * Answers every remaining question for an AI-using participant and lands on
 * the review screen.
 */
export async function answerCoreQuestions(page: Page) {
  await typeAnswer(page, "A metric dropped and we had to choose a response.");

  await page.getByRole("checkbox", { name: "Data or analytics" }).click();
  await page.getByRole("checkbox", { name: "AI-based tools" }).click();
  await page.getByRole("textbox").fill("The data mattered most.");
  await continueStep(page);

  await page.getByRole("textbox").first().fill("The evidence conflicted.");
  await page
    .getByRole("textbox")
    .nth(1)
    .fill("We compared the downside of each option.");
  await continueStep(page);

  await page
    .getByRole("textbox")
    .first()
    .fill("We reviewed data quality, privacy, and technical risk.");
  await page
    .getByRole("textbox")
    .nth(1)
    .fill("We compared the AI output with the raw data.");
  await continueStep(page);

  await page
    .getByRole("textbox")
    .first()
    .fill("Adoption improved after the release.");
  await page
    .getByRole("textbox")
    .nth(1)
    .fill("We changed the next rollout based on what we learned.");
  await continueStep(page);

  await page
    .getByRole("textbox")
    .first()
    .fill("Earlier access to reliable evidence would have helped.");
  await page
    .getByRole("textbox")
    .nth(1)
    .fill("I wish we had a shared evidence summary.");
  await continueStep(page);

  await page.getByRole("button", { name: "Skip for now" }).click();

  await expect(
    page.getByRole("heading", { name: "Review your answers" })
  ).toBeVisible();
}

export async function signInAsResearcher(page: Page) {
  await page.goto("/admin/login");
  await page.getByLabel("Email").fill(RESEARCHER_EMAIL);
  await page.getByLabel("Password").fill(RESEARCHER_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(
    page.getByRole("link", { name: "Research dashboard" })
  ).toBeVisible();
}
