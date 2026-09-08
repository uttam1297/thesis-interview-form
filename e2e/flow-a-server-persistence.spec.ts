import { expect, test } from "@playwright/test";

import {
  answerCoreQuestions,
  answerProfile,
  beginAndConsent,
  continueStep,
} from "./helpers";

test("Flow A: anonymous participant consents, answers, autosaves to the server and submits", async ({
  page,
}) => {
  const saveRequests: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/api/sessions")) {
      saveRequests.push(
        `${request.method()} ${new URL(request.url()).pathname}`
      );
    }
  });

  await beginAndConsent(page);

  // Consent creates the server session; answers then sync as they are given.
  await expect(
    page.getByText("Saved").or(page.getByText("Saving…"))
  ).toBeVisible();
  expect(saveRequests).toContain("POST /api/sessions");

  await answerProfile(page, "Daily");
  await answerCoreQuestions(page);

  await expect(page.getByText("Product Manager")).toBeVisible();
  await page.getByRole("button", { name: "Submit" }).click();

  await expect(page.getByRole("heading", { name: "Thank you." })).toBeVisible();
  await expect(page.getByText(/P\d{3}/)).toBeVisible();
  expect(saveRequests).toContain("PATCH /api/sessions/current");
  expect(saveRequests).toContain("POST /api/sessions/current/submit");

  // The session is closed: reloading offers a fresh interview, not the old one.
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Begin the interview" })
  ).toBeVisible();
});

test("Flow A: a required question still blocks Continue", async ({ page }) => {
  await beginAndConsent(page);
  await continueStep(page);
  await expect(page.getByText(/needs an answer/i)).toBeVisible();
});
