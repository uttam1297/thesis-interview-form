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

/** Walks welcome → consent → first section intro. */
export async function beginAndConsent(page: Page) {
  await page.goto("/interview");
  await page.getByRole("button", { name: "Begin the interview" }).click();
  // Participation consent; speech-to-text is a separate, optional box.
  await page.getByRole("checkbox", { name: /agree to take part/i }).click();
  await continueStep(page);
  await expect(page.getByRole("heading", { name: "About you" })).toBeVisible();
  await continueStep(page);
}

/** Answers the six profile questions. */
export async function answerProfile(
  page: Page,
  aiFrequency: "Not yet" | "Daily" = "Daily"
) {
  await chooseAndContinue(page, "Product Manager");
  await chooseAndContinue(page, "6–10 years");
  await chooseAndContinue(page, "Software / SaaS");
  await page.getByRole("checkbox", { name: "B2B SaaS" }).click();
  await continueStep(page);
  await chooseAndContinue(page, "For most decisions");
  await chooseAndContinue(page, aiFrequency);
}

/**
 * Answers every remaining question for an AI-using participant and lands on
 * the review screen.
 */
export async function answerCoreQuestions(page: Page) {
  await continueStep(page); // How decisions happen intro
  await typeAnswer(page, "We start from a metric drop and work backwards.");
  // The follow-up on what made the decision unusual is required from 2.3.0.
  await typeAnswer(page, "Two teams disagreed on what the metric meant.");
  await page.getByRole("checkbox", { name: "Product usage analytics" }).click();
  await continueStep(page);
  await typeAnswer(page, "Analytics frames the options; leadership decides.");

  await continueStep(page); // Data and AI intro
  await typeAnswer(page, "Summarising customer feedback.");
  await page.getByRole("radio", { name: "4" }).click();
  await continueStep(page);
  await typeAnswer(page, "We triangulate against support tickets.");
  await typeAnswer(page, "Spot-check against the raw data.");

  await continueStep(page); // Challenges intro
  await typeAnswer(page, "Insights arrive too late to act on.");
  // Prioritisation factors: choose up to three.
  await page.getByRole("checkbox", { name: "Effort and cost" }).click();
  await page
    .getByRole("checkbox", { name: "Expected quantitative impact" })
    .click();
  await continueStep(page);
  await typeAnswer(page, "Impact against effort in planning.");

  await continueStep(page); // Governance intro
  await typeAnswer(page, "GDPR limits what we can log.");
  await typeAnswer(page, "We compare the KPI four weeks later.");

  await continueStep(page); // Requirements intro
  await typeAnswer(page, "Explain its reasoning and show the data used.");
  await page.getByRole("button", { name: "Skip for now" }).click();
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
