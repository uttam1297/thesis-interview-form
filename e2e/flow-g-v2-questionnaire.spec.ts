import { expect, test } from "@playwright/test";

import {
  answerProfile,
  beginAndConsent,
  continueStep,
  typeAnswer,
} from "./helpers";

async function reachDecisionInputs(page: Parameters<typeof answerProfile>[0]) {
  await beginAndConsent(page);
  await answerProfile(page);
  await typeAnswer(page, "We had to decide whether to change the rollout.");
  await expect(
    page.getByRole("heading", {
      name: "What did you rely on when deciding what to do?",
    })
  ).toBeVisible();
}

test("V2 keeps Q2 selection and required elaboration on one screen", async ({
  page,
}) => {
  await reachDecisionInputs(page);
  await expect(
    page.getByText("Which of these mattered most, and why?")
  ).toBeVisible();
  await expect(page.getByText("Required", { exact: true })).toBeVisible();
  await page.getByRole("checkbox", { name: "Data or analytics" }).click();
  await continueStep(page);
  await expect(
    page.getByText(/explain which input mattered most and why/i)
  ).toBeVisible();
  await page.getByRole("textbox").fill("The analytics were most important.");
  await continueStep(page);
  await expect(
    page.getByRole("heading", {
      name: "What, if anything, made that decision difficult or uncertain?",
    })
  ).toBeVisible();
});

test("V2 shows the AI probe only when AI was selected in Q2", async ({
  page,
}) => {
  await reachDecisionInputs(page);
  await page.getByRole("checkbox", { name: "Data or analytics" }).click();
  await page.getByRole("textbox").fill("The data mattered most.");
  await continueStep(page);
  await page
    .getByRole("radio", { name: "Nothing — it was fairly straightforward" })
    .click();
  await continueStep(page);
  await expect(
    page.getByText(
      "How did you decide whether the AI output was reliable enough to use?"
    )
  ).toHaveCount(0);

  await page.getByRole("button", { name: "Back" }).click();
  await page.getByRole("button", { name: "Back" }).click();
  await page.getByRole("checkbox", { name: "AI-based tools" }).click();
  await continueStep(page);
  await page
    .getByRole("radio", { name: "Nothing — it was fairly straightforward" })
    .click();
  await continueStep(page);
  await expect(
    page.getByText(
      "How did you decide whether the AI output was reliable enough to use?"
    )
  ).toBeVisible();
});

test("V2 rejects punctuation-only text and accepts structured non-answers", async ({
  page,
}) => {
  await beginAndConsent(page);
  await answerProfile(page);

  await page.getByRole("textbox").fill("...");
  await continueStep(page);
  await expect(page.getByText(/use words or numbers/i)).toBeVisible();

  await page.getByRole("textbox").fill("");
  await page
    .getByRole("radio", {
      name: "I can't think of a relevant example right now.",
    })
    .click();
  await continueStep(page);
  await page.getByRole("checkbox", { name: "Technical constraints" }).click();
  await page
    .getByRole("textbox")
    .fill("The technical constraints ruled out the other choices.");
  await continueStep(page);
  await page
    .getByRole("radio", { name: "Nothing — it was fairly straightforward" })
    .click();
  await continueStep(page);
  await page.getByRole("radio", { name: "Not applicable to my role" }).click();
  await continueStep(page);
  await page
    .getByRole("radio", { name: "The outcome was not formally measured" })
    .click();
  await continueStep(page);
  await page.getByRole("radio", { name: "Nothing in particular" }).click();
  await continueStep(page);
  await page.getByRole("button", { name: "Skip for now" }).click();

  await expect(
    page.getByRole("heading", { name: "Review your answers" })
  ).toBeVisible();
  await expect(page.getByText("Not applicable to my role")).toBeVisible();
  await expect(
    page.getByText("The outcome was not formally measured")
  ).toBeVisible();
  await expect(page.getByText("Skipped")).toBeVisible();
});

test("the server refuses submission when Q2 has no explanation", async ({
  request,
}) => {
  const started = await request.post("/api/sessions", {
    data: {
      questionnaireVersion: "v2",
      consentVersion: "v2-e2e",
      participationConsent: true,
      recordingConsent: false,
    },
  });
  expect(started.status()).toBe(201);
  const { resumeToken } = (await started.json()) as { resumeToken: string };
  const selected = (questionKey: string, value: string) => ({
    questionKey,
    value: { kind: "single", value },
    skipped: false,
    method: "selected",
    updatedAt: new Date().toISOString(),
  });
  const nonAnswer = (questionKey: string, value: string) => ({
    questionKey,
    value: { kind: "guided_text", text: "", nonAnswer: value },
    skipped: false,
    method: "selected",
    updatedAt: new Date().toISOString(),
  });

  const saved = await request.patch("/api/sessions/current", {
    headers: { "x-resume-token": resumeToken },
    data: {
      responses: [
        selected("v2_profile_role", "product"),
        selected("v2_profile_experience", "6-10"),
        selected("v2_profile_industry", "software_saas"),
        selected("v2_profile_decision_involvement", "own"),
        nonAnswer("v2_q1_decision_context", "cant_think_of_example"),
        {
          questionKey: "v2_q2_decision_inputs",
          value: {
            kind: "multi_elaboration",
            values: ["data_analytics"],
          },
          skipped: false,
          method: "selected",
          updatedAt: new Date().toISOString(),
        },
        nonAnswer("v2_q3_difficulty", "straightforward"),
        nonAnswer("v2_q4_validation_governance", "no_special_checks"),
        nonAnswer("v2_q5_outcome_learning", "not_formally_measured"),
        nonAnswer("v2_q6_improvement", "nothing_needed"),
      ],
    },
  });
  expect(saved.status()).toBe(200);

  const submitted = await request.post("/api/sessions/current/submit", {
    headers: { "x-resume-token": resumeToken },
  });
  expect(submitted.status()).toBe(422);
  expect(await submitted.json()).toEqual({ error: "invalid_response" });
});
