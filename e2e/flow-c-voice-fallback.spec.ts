import { expect, test } from "@playwright/test";

import {
  answerProfile,
  beginAndConsent,
  continueStep,
  typeAnswer,
} from "./helpers";

test("Flow C: without speech recognition, open questions fall back to typing", async ({
  page,
}) => {
  // Simulate a browser with no Web Speech API before any app code runs.
  await page.addInitScript(() => {
    const w = window as unknown as Record<string, unknown>;
    delete w.SpeechRecognition;
    delete w.webkitSpeechRecognition;
  });

  await beginAndConsent(page);
  await answerProfile(page, "Not yet");

  await continueStep(page); // How decisions happen intro
  await expect(
    page.getByText(/voice input isn't available in this browser/i)
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /speak answer/i })).toHaveCount(
    0
  );
  await typeAnswer(page, "Typed because voice is unavailable.");
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.getByRole("checkbox", { name: "Experiments" }).click();
  await continueStep(page);
  await typeAnswer(page, "Experiments decide launches.");

  // Non-AI branch wording appears instead of the AI-user question.
  await continueStep(page);
  await expect(
    page.getByRole("heading", { name: /what has kept them out/i })
  ).toBeVisible();
  await typeAnswer(page, "No budget yet.");
  await page.getByRole("radio", { name: "3" }).click();
  await continueStep(page);
  await typeAnswer(page, "Sample size checks.");
  await expect(
    page.getByRole("heading", { name: /if an ai tool were introduced/i })
  ).toBeVisible();
  await typeAnswer(page, "It would need to show its sources.");

  await continueStep(page);
  await typeAnswer(page, "Slow data pipelines.");
  await continueStep(page); // accept default ranking
  await typeAnswer(page, "Impact first.");
  await continueStep(page);
  await typeAnswer(page, "Legal review.");
  await typeAnswer(page, "Retro after release.");
  await continueStep(page);
  await typeAnswer(page, "Clear provenance.");
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.getByRole("button", { name: "Skip for now" }).click();

  await expect(
    page.getByRole("heading", { name: "Review your answers" })
  ).toBeVisible();
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("heading", { name: "Thank you." })).toBeVisible();
});
