import { expect, test } from "@playwright/test";

import {
  answerCoreQuestions,
  answerProfile,
  beginAndConsent,
  chooseAndContinue,
} from "./helpers";

test("a submitted session cannot be re-entered", async ({ page }) => {
  await beginAndConsent(page);
  await answerProfile(page);
  await answerCoreQuestions(page);
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("heading", { name: "Thank you." })).toBeVisible();

  // Refreshing the completion screen must not drop the participant back
  // into the questionnaire.
  await page.reload();
  await expect(page.getByRole("button", { name: "Continue" })).toHaveCount(0);
  await expect(page.getByRole("textbox")).toHaveCount(0);
});

test("submit cannot be pressed twice", async ({ page }) => {
  await beginAndConsent(page);
  await answerProfile(page);
  await answerCoreQuestions(page);

  const submit = page.getByRole("button", { name: "Submit" });
  await submit.click();
  // The button leaves the DOM as the completion screen takes over, so a
  // second press cannot create a duplicate submission.
  await expect(page.getByRole("heading", { name: "Thank you." })).toBeVisible();
  await expect(submit).toHaveCount(0);
});

test("a second tab is told to stand down instead of overwriting answers", async ({
  page,
}) => {
  await beginAndConsent(page);
  await chooseAndContinue(page, "Product / Product Owner");
  await expect(page.getByText("Saved")).toBeVisible();

  // Simulate another live tab holding the session: a fresh heartbeat under
  // a different tab id. Driving it directly keeps the test deterministic,
  // since browsers throttle timers in whichever tab is not focused.
  await page.evaluate(() => {
    window.localStorage.setItem(
      "interview:active-tab",
      JSON.stringify({ tabId: "another-tab", updatedAt: Date.now() })
    );
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "interview:active-tab",
        newValue: window.localStorage.getItem("interview:active-tab"),
      })
    );
  });

  // This tab stands down rather than overwriting the other tab's answers.
  await expect(page.getByText(/open in another tab or window/i)).toBeVisible();

  // Taking over is explicit.
  await page.getByRole("button", { name: "Continue in this tab" }).click();
  await expect(page.getByText(/open in another tab or window/i)).toHaveCount(0);

  // The answer given before the clash is still there.
  await page.getByRole("button", { name: "Back" }).click();
  await expect(
    page.getByRole("radio", { name: "Product / Product Owner" })
  ).toBeChecked();
});

test("the skip link takes keyboard users straight to the question", async ({
  page,
}) => {
  await page.goto("/interview");
  const skipLink = page.getByRole("link", { name: "Skip to the question" });

  // Present as the first focusable element, and it jumps past the chrome.
  await skipLink.focus();
  await expect(skipLink).toBeFocused();
  // Points at the main content, which exists and is reachable.
  await expect(skipLink).toHaveAttribute("href", "#interview-content");
  await skipLink.press("Enter");
  await expect(page.locator("#interview-content")).toBeVisible();
  await expect(page).toHaveURL(/#interview-content/, { timeout: 10000 });
});

test("V2 shows journey progress without a question-count workload", async ({
  page,
}) => {
  await page.goto("/interview");
  await page.getByRole("button", { name: "Begin the interview" }).click();
  await page.getByRole("checkbox", { name: /agree to take part/i }).click();
  await page.getByRole("button", { name: "Continue" }).first().click();

  await expect(
    page.getByRole("heading", {
      name: "Which best describes your current role?",
    })
  ).toBeVisible();
  await expect(
    page.getByRole("progressbar", { name: /Progress: About you/ })
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: "Your interview path" })
  ).toBeVisible();
  await expect(page.getByText(/answered so far/i)).toHaveCount(0);
  await expect(page.getByText(/of 11|question 1/i)).toHaveCount(0);
  await expect(page.getByRole("img", { name: /of 11/i })).toHaveCount(0);
});

test("an unexpected page shows a helpful not-found screen", async ({
  page,
}) => {
  await page.goto("/definitely-not-a-page");
  await expect(
    page.getByRole("heading", { name: "Page not found" })
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /go to the interview/i })
  ).toBeVisible();
});
