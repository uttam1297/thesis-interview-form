import { expect, test } from "@playwright/test";

import {
  answerProfile,
  beginAndConsent,
  continueStep,
  typeAnswer,
} from "./helpers";

test("Flow A: welcome → consent → profile → all questions → review → submit", async ({
  page,
}) => {
  await beginAndConsent(page);
  await answerProfile(page, "Daily");

  // How decisions happen
  await expect(
    page.getByRole("heading", { name: "How decisions happen" })
  ).toBeVisible();
  await continueStep(page);
  await typeAnswer(page, "We start from a metric drop and work backwards.");
  await page.getByRole("button", { name: "Skip for now" }).click(); // optional elaboration
  await page.getByRole("checkbox", { name: "Product usage analytics" }).click();
  await continueStep(page);
  await typeAnswer(page, "Analytics frames the options; leadership decides.");

  // Data and AI (AI-user branch)
  await continueStep(page);
  await expect(
    page.getByRole("heading", {
      name: /where do ai-based tools currently support/i,
    })
  ).toBeVisible();
  await typeAnswer(page, "Summarising feedback.");
  await page.getByRole("radio", { name: "4" }).click();
  await continueStep(page);
  await typeAnswer(page, "We triangulate against support tickets.");
  await expect(
    page.getByRole("heading", { name: /trust, verify or challenge it/i })
  ).toBeVisible();
  await typeAnswer(page, "Spot-check against raw data.");

  // Challenges and trade-offs
  await continueStep(page);
  await typeAnswer(page, "Insights arrive too late.");
  await page.getByRole("button", { name: "Move Effort and cost up" }).click();
  await continueStep(page);
  await typeAnswer(page, "Impact vs effort in a planning meeting.");

  // Governance and learning
  await continueStep(page);
  await typeAnswer(page, "GDPR limits what we can log.");
  await typeAnswer(page, "We compare the KPI four weeks later.");

  // Better decision support
  await continueStep(page);
  await typeAnswer(page, "Explain its reasoning and show the data it used.");
  await page.getByRole("button", { name: "Skip for now" }).click();
  await page.getByRole("button", { name: "Skip for now" }).click();

  // Review
  await expect(
    page.getByRole("heading", { name: "Review your answers" })
  ).toBeVisible();
  await expect(page.getByText("Summarising feedback.")).toBeVisible();
  await expect(
    page.getByText(/3\. Effort and cost · 4\. Strategic fit/)
  ).toBeVisible();

  // Edit from review and return
  await page.getByRole("button", { name: /Edit: Current role/ }).click();
  await page.getByRole("radio", { name: "Product Owner" }).click();
  await page.getByRole("button", { name: "Save and return to review" }).click();
  await expect(
    page.getByRole("heading", { name: "Review your answers" })
  ).toBeVisible();
  await expect(page.getByText("Product Owner")).toBeVisible();

  await page.getByRole("button", { name: "Submit" }).click();
  await expect(page.getByRole("heading", { name: "Thank you." })).toBeVisible();
  await expect(page.getByText(/P\d{3}/)).toBeVisible();

  // Draft cleared: reloading starts fresh.
  await page.reload();
  await expect(page.getByRole("button", { name: "Begin" })).toBeVisible();
});
