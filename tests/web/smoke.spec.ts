import { test, expect } from '@playwright/test';

test.describe.serial('Production Smoke Test', () => {
  test('landing page loads', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CrewCircle/);
  });

  test('login page is accessible', async ({ page }) => {
    await page.goto('/login');
    await expect(page).toHaveURL(/\/login/);
  });

  test('signup page is accessible', async ({ page }) => {
    await page.goto('/signup');
    await expect(page).toHaveURL(/\/signup/);
  });

  test('roster page is accessible', async ({ page }) => {
    await page.goto('/roster');
    await expect(page.locator('body')).toBeVisible();
  });
});
