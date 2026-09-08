import { expect, test } from "@playwright/test";

import { beginAndConsent, chooseAndContinue } from "./helpers";

test("Flow C: a temporary save failure keeps the answer and recovers on retry", async ({
  page,
}) => {
  await beginAndConsent(page);
  await chooseAndContinue(page, "Product Manager");
  await expect(page.getByText("Saved")).toBeVisible();

  // Break the connection to the save endpoint.
  await page.route("**/api/sessions/current", async (route) => {
    if (route.request().method() === "PATCH") return route.abort("failed");
    return route.fallback();
  });

  await page.getByRole("radio", { name: "6–10 years" }).click();

  // The participant is told plainly, and the answer is still on screen.
  await expect(page.getByText(/offline|could not save/i)).toBeVisible({
    timeout: 15000,
  });
  await expect(page.getByRole("radio", { name: "6–10 years" })).toBeChecked();

  // Connection returns.
  await page.unroute("**/api/sessions/current");
  await page.getByRole("button", { name: "Retry" }).click();
  await expect(page.getByText("Saved")).toBeVisible({ timeout: 15000 });

  // The answer made it to the server: a reload restores it.
  await page.reload();
  await page.getByRole("button", { name: "Continue previous session" }).click();
  await expect(page.getByRole("radio", { name: "6–10 years" })).toBeChecked();
});

test("Flow C: answers typed while offline survive a reload", async ({
  page,
}) => {
  await beginAndConsent(page);
  await chooseAndContinue(page, "Product Manager");
  await expect(page.getByText("Saved")).toBeVisible();

  await page.route("**/api/sessions/current", async (route) => {
    if (route.request().method() === "PATCH") return route.abort("failed");
    return route.fallback();
  });
  await page.getByRole("radio", { name: "More than 10 years" }).click();
  await expect(page.getByText(/offline|could not save/i)).toBeVisible({
    timeout: 15000,
  });

  // Local draft is the safety net while the server is unreachable.
  const draft = await page.evaluate(() =>
    window.localStorage.getItem("interview:draft")
  );
  expect(draft).toContain("10+");
});
