import { expect, test } from "@playwright/test";

test("participant can walk the full mock interview flow", async ({ page }) => {
  await page.goto("/");

  // Welcome
  await expect(
    page.getByRole("heading", { name: /help us understand/i })
  ).toBeVisible();
  await page.getByRole("button", { name: "Begin" }).click();

  // Consent
  await expect(page).toHaveURL(/\/interview\/consent$/);
  await page.getByRole("checkbox").click();
  await page.getByRole("button", { name: "Continue" }).click();

  // Profile
  await expect(page).toHaveURL(/\/interview\/profile$/);
  await page.getByRole("radio", { name: "Product Manager" }).click();
  await page.getByRole("radio", { name: "4" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  // Section transition
  await expect(page).toHaveURL(/\/interview\/section-transition$/);
  await page.getByRole("button", { name: "Continue" }).click();

  // Mock question (open-ended + voice)
  await expect(page).toHaveURL(/\/interview\/question$/);
  await expect(
    page.getByRole("heading", { name: /reliable enough to support/i })
  ).toBeVisible();
  await page.getByRole("textbox").fill("We cross-check against tickets.");
  await page.getByRole("button", { name: "Continue" }).click();

  // MCQ / multi-select question
  await expect(page).toHaveURL(/\/interview\/question-choice$/);
  await page.getByRole("checkbox", { name: "Analytics platform" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  // Review
  await expect(page).toHaveURL(/\/interview\/review$/);
  await page.getByRole("button", { name: "Submit" }).click();

  // Completion
  await expect(page).toHaveURL(/\/interview\/complete$/);
  await expect(page.getByRole("heading", { name: "Thank you." })).toBeVisible();
  await expect(page.getByText("P014")).toBeVisible();
});

test("voice control walks through idle, listening, and captured states", async ({
  page,
}) => {
  await page.goto("/interview/question");

  const voiceButton = page.getByRole("button", { name: /speak answer/i });
  await expect(voiceButton).toBeVisible();

  await voiceButton.click();
  await expect(page.getByRole("button", { name: /listening/i })).toBeVisible();

  await page.getByRole("button", { name: /listening/i }).click();
  await expect(page.getByRole("textbox")).toHaveValue(
    /analytics team pulls the last quarter/i
  );
});
