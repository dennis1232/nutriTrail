import path from "node:path";
import { test, expect } from "@playwright/test";

const TEST_IMAGE = path.join(process.cwd(), "tests", "e2e", "fixtures", "test-meal.jpg");

test.describe("core user journey", () => {
  test("register, onboard, log a manual meal, and see it on the dashboard", async ({
    page,
  }) => {
    const email = `e2e-${Date.now()}@example.com`;

    await page.goto("/en");
    await page.click('a[href="/en/register"]');
    await page.waitForURL(/\/register/);

    await page.getByLabel("Display name").fill("E2E Tester");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Create account" }).click();

    await page.waitForURL(/\/onboarding/);

    await page.getByLabel("Display name").fill("E2E Tester");
    await page.locator('input[type="date"]').fill("1995-05-20");
    await page.getByRole("button", { name: "Continue" }).click();

    await page.locator("input#heightCm").fill("178");
    await page.locator("input#currentWeightKg").fill("75");
    await page.getByRole("button", { name: "Continue" }).click();

    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Finish setup" }).click();

    await page.waitForURL(/\/today/);
    await expect(page.getByText("Nothing logged yet today")).toBeVisible();

    await page.getByRole("button", { name: "Add meal" }).click();
    await page.getByRole("link", { name: /Create custom food/ }).click();
    await page.waitForURL(/\/add-meal\/manual/);

    await page.locator('input[name="name"]').fill("E2E Apple");
    await page.locator('input[name="caloriesPer100g"]').fill("52");
    await page.locator('input[name="proteinPer100g"]').fill("0.3");
    await page.locator('input[name="carbohydratesPer100g"]').fill("14");
    await page.locator('input[name="fatPer100g"]').fill("0.2");
    await page.getByRole("button", { name: "Add to meal" }).click();

    await expect(page.getByText("E2E Apple")).toBeVisible();
    await page.getByRole("button", { name: "Save meal" }).click();

    await page.waitForURL(/\/today/);
    await expect(page.getByText("Custom meal")).toBeVisible();
  });

  test("AI mock photo analysis: upload, review, edit, and save", async ({ page }) => {
    const email = `e2e-ai-${Date.now()}@example.com`;

    await page.goto("/en");
    await page.click('a[href="/en/register"]');
    await page.waitForURL(/\/register/);
    await page.getByLabel("Display name").fill("AI Tester");
    await page.getByLabel("Email").fill(email);
    await page.getByLabel("Password").fill("password123");
    await page.getByRole("button", { name: "Create account" }).click();
    await page.waitForURL(/\/onboarding/);

    await page.getByLabel("Display name").fill("AI Tester");
    await page.locator('input[type="date"]').fill("1990-01-01");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.locator("input#heightCm").fill("170");
    await page.locator("input#currentWeightKg").fill("65");
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Finish setup" }).click();
    await page.waitForURL(/\/today/);

    await page.goto("/en/add-meal/photo");
    await page.setInputFiles("#meal-photo", TEST_IMAGE);
    await page.locator("#meal-note").fill("Grilled chicken with rice");
    await page.getByRole("button", { name: /Analyze photo/ }).click();

    // The estimate must be reviewable/editable, never auto-saved.
    await expect(page.getByText("Grilled chicken breast")).toBeVisible();
    await expect(page.getByText(/estimate/i).first()).toBeVisible();

    const quantityInput = page.locator('input[type="number"]').first();
    await quantityInput.fill("2");

    await page.getByRole("button", { name: "Save meal" }).click();
    await page.waitForURL(/\/today/);
    await expect(page.getByText("AI estimate")).toBeVisible();
  });

  test("Hebrew locale renders RTL", async ({ page }) => {
    await page.goto("/he");
    const dir = await page.locator("html").getAttribute("dir");
    expect(dir).toBe("rtl");
  });

  test("English locale renders LTR", async ({ page }) => {
    await page.goto("/en");
    const dir = await page.locator("html").getAttribute("dir");
    expect(dir).toBe("ltr");
  });
});
