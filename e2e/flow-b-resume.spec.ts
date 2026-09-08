import { expect, test } from "@playwright/test";

import { beginAndConsent, chooseAndContinue, waitForSaved } from "./helpers";

test("Flow B: a participant leaves and resumes in the same browser", async ({
  page,
}) => {
  await beginAndConsent(page);
  await chooseAndContinue(page, "UX Researcher");
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
  await chooseAndContinue(page, "Product Owner");
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
    otherPage.getByRole("radio", { name: "Product Owner" })
  ).toBeChecked();
  await otherContext.close();
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
  await chooseAndContinue(page, "Product / Data Analyst");
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
