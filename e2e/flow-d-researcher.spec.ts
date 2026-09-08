import { expect, test } from "@playwright/test";

import {
  answerProfile,
  beginAndConsent,
  chooseAndContinue,
  signInAsResearcher,
  waitForSaved,
} from "./helpers";

test("Flow D: admin routes require authentication", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/admin\/login/);
  await expect(
    page.getByRole("heading", { name: "Researcher sign in" })
  ).toBeVisible();

  // The export endpoint is protected on the server, not just in the UI.
  const response = await page.request.get("/api/admin/export?format=csv");
  expect(response.status()).toBe(401);
});

test("Flow D: researcher signs in, opens a session and exports data", async ({
  page,
}) => {
  // Produce a session to look at. Saving is debounced, so let the last
  // answer reach the server before reading it back through the export.
  await beginAndConsent(page);
  await answerProfile(page, "Daily");
  await waitForSaved(page);

  await signInAsResearcher(page);

  // Overview and list.
  await expect(page.getByRole("link", { name: "By construct" })).toBeVisible();
  const firstParticipant = page.getByRole("link", { name: /^P\d{3}$/ }).first();
  await expect(firstParticipant).toBeVisible();
  const participantCode = (await firstParticipant.textContent())?.trim();
  await firstParticipant.click();

  // Session detail: profile, consent state and responses by construct.
  await expect(
    page.getByRole("heading", { name: participantCode! })
  ).toBeVisible();
  await expect(page.getByText("Session and consent")).toBeVisible();
  await expect(page.getByText("Participation")).toBeVisible();
  await expect(page.getByText("Responses by construct")).toBeVisible();
  await expect(page.getByText("participant_profile")).toBeVisible();

  // Researcher notes are stored against the session, not mixed into answers.
  await page
    .getByRole("textbox", { name: "Researcher notes" })
    .fill("Pilot participant, spoke quickly.");
  await page.getByRole("button", { name: "Save notes" }).click();
  await expect(page.getByText("Saved", { exact: true })).toBeVisible();

  // Cross-participant construct view.
  await page.getByRole("link", { name: "By construct" }).click();
  await expect(
    page.getByRole("heading", { name: "Responses by construct" })
  ).toBeVisible();

  // Exports.
  const csv = await page.request.get("/api/admin/export?format=csv");
  expect(csv.status()).toBe(200);
  expect(csv.headers()["content-type"]).toContain("text/csv");
  const csvBody = await csv.text();
  expect(csvBody).toContain("participant_code,response_mode");
  expect(csvBody).toContain(participantCode!);
  // Internal identifiers and tokens stay out of research exports.
  expect(csvBody).not.toContain("resume_token");
  expect(csvBody).not.toContain("session_id");

  const json = await page.request.get("/api/admin/export?format=json");
  expect(json.status()).toBe(200);
  const parsed = (await json.json()) as {
    participants: Array<{ participant_code: string; responses: unknown[] }>;
  };
  expect(parsed.participants.length).toBeGreaterThan(0);

  const long = await page.request.get("/api/admin/export?format=long");
  expect(await long.text()).toContain(
    "participant,construct,question,response,collection_mode"
  );
});

test("Flow D: a participant cannot reach another participant's session", async ({
  page,
  browser,
}) => {
  await beginAndConsent(page);
  await chooseAndContinue(page, "Product Manager");
  await expect(page.getByText("Saved")).toBeVisible();
  const victimToken = await page.evaluate(() =>
    window.localStorage.getItem("interview:resume-token")
  );

  const attackerContext = await browser.newContext();
  const attackerPage = await attackerContext.newPage();
  await attackerPage.goto("/interview");

  // A guessed or altered token is refused.
  const tampered = `${victimToken!.slice(0, -4)}AAAA`;
  const guessed = await attackerPage.request.get("/api/sessions/current", {
    headers: { "x-resume-token": tampered },
  });
  expect([401, 404, 410]).toContain(guessed.status());

  // Admin data is unreachable without a researcher session.
  const admin = await attackerPage.request.get("/api/admin/export?format=csv");
  expect(admin.status()).toBe(401);

  await attackerContext.close();
});

test("Flow D: a withdrawal request deletes that participant's responses", async ({
  page,
}) => {
  // A session to withdraw.
  await beginAndConsent(page);
  await answerProfile(page, "Daily");
  await waitForSaved(page);

  await signInAsResearcher(page);
  const participant = page.getByRole("link", { name: /^P\d{3}$/ }).first();
  const participantCode = (await participant.textContent())?.trim();
  await participant.click();

  await expect(page.getByText("Responses by construct")).toBeVisible();

  // Consent promises deletion on request, so it has to be a real action.
  await page
    .getByRole("button", { name: `Withdraw ${participantCode}` })
    .click();
  await page
    .getByRole("button", { name: "Delete responses permanently" })
    .click();

  await expect(page.getByText(/This participant withdrew/i)).toBeVisible();

  // The answers are gone from the export, not merely hidden.
  const csv = await page.request.get("/api/admin/export?format=csv");
  expect(await csv.text()).not.toContain(participantCode!);
});
