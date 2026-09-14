import { expect, test } from "@playwright/test";

import { beginAndConsent, chooseAndContinue, waitForSaved } from "./helpers";

test("Flow B: a participant leaves and resumes in the same browser", async ({
  page,
}) => {
  await beginAndConsent(page);
  await chooseAndContinue(page, "Design / UX / Research");
  await chooseAndContinue(page, "2–5 years");
  await expect(
    page.getByRole("heading", { name: /which industry/i })
  ).toBeVisible();

  await expect(page.getByText("Saved")).toBeVisible();
  await page.reload();

  // A returning visitor is asked before their answers are restored.
  await page.getByRole("button", { name: "Continue previous session" }).click();

  // Answers came back from the server, at the same position.
  await expect(
    page.getByRole("heading", { name: /which industry/i })
  ).toBeVisible();
  await page.getByRole("button", { name: "Back" }).click();
  await expect(page.getByRole("radio", { name: "2–5 years" })).toBeChecked();
});

test("Flow B: a resume link continues the session in a different browser", async ({
  page,
  browser,
}) => {
  await beginAndConsent(page);
  await chooseAndContinue(page, "Product / Product Owner");
  await waitForSaved(page);

  // Read the link the participant would copy, without exposing it on screen.
  const resumeUrl = await page.evaluate(() => {
    const token = window.localStorage.getItem("interview:resume-token");
    return `${window.location.origin}/interview/resume?token=${encodeURIComponent(token ?? "")}`;
  });
  expect(resumeUrl).toContain("token=");

  // A clean context: no local draft, only the link.
  const otherContext = await browser.newContext();
  const otherPage = await otherContext.newPage();
  await otherPage.goto(resumeUrl);

  await expect(
    otherPage.getByRole("heading", { name: /years of relevant/i })
  ).toBeVisible();
  // The token is not left sitting in the URL.
  expect(otherPage.url()).not.toContain("token=");

  await otherPage.getByRole("button", { name: "Back" }).click();
  await expect(
    otherPage.getByRole("radio", { name: "Product / Product Owner" })
  ).toBeChecked();
  await otherContext.close();
});

test("Flow B: a legacy V1 resume link keeps its frozen questionnaire and answers", async ({
  page,
  browser,
}) => {
  const started = await page.request.post("/api/sessions", {
    data: {
      questionnaireVersion: "2.4.0",
      consentVersion: "v1-resume-e2e",
      participationConsent: true,
      recordingConsent: false,
    },
  });
  expect(started.status()).toBe(201);
  const { resumeToken } = (await started.json()) as { resumeToken: string };
  expect(resumeToken).not.toMatch(/^v2_/);

  const saved = await page.request.patch("/api/sessions/current", {
    headers: { "x-resume-token": resumeToken },
    data: {
      currentStepId: "question:profile-experience",
      responses: [
        {
          questionKey: "profile-role",
          value: { kind: "single", value: "product_manager" },
          skipped: false,
          method: "selected",
          updatedAt: new Date().toISOString(),
        },
      ],
    },
  });
  expect(saved.status()).toBe(200);

  const context = await browser.newContext();
  const resumed = await context.newPage();
  await resumed.goto(
    `/interview/resume?token=${encodeURIComponent(resumeToken)}`
  );
  await expect(
    resumed.getByRole("heading", {
      name: "How many years of relevant experience do you have?",
    })
  ).toBeVisible();
  await resumed.getByRole("button", { name: "Back" }).click();
  await expect(
    resumed.getByRole("radio", { name: "Product Manager" })
  ).toBeChecked();
  expect(resumed.url()).not.toContain("token=");
  await context.close();
});

test("Flow B: an unknown resume link is refused with an explanation", async ({
  page,
}) => {
  await page.goto(
    "/interview/resume?token=AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA"
  );
  await expect(
    page.getByRole("heading", { name: /could not continue that session/i })
  ).toBeVisible();
  await expect(page.getByText(/link is not valid/i)).toBeVisible();
});

test("Flow B: Start over abandons the local draft and begins a new session", async ({
  page,
}) => {
  await beginAndConsent(page);
  await chooseAndContinue(page, "Data / Analytics / AI");
  await expect(page.getByText("Saved")).toBeVisible();

  // Simulate a returning visitor whose server session is gone but whose
  // local draft remains.
  await page.evaluate(() =>
    window.localStorage.removeItem("interview:resume-token")
  );
  await page.reload();

  await expect(
    page.getByText("You have an unfinished session on this device.")
  ).toBeVisible();
  await page.getByRole("button", { name: "Start over" }).click();
  await expect(
    page.getByRole("button", { name: "Begin the interview" })
  ).toBeVisible();
});
