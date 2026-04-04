import { test, expect } from '@playwright/test';

test.describe('Auth flow', () => {
  test('successful signup redirects to dashboard', async ({ page }) => {
    await page.goto('/signup');

    // Generate unique email for this test run to avoid conflicts
    const uniqueEmail = `test-${Date.now()}@example.com`;

    await page.fill('input[id="email"]', uniqueEmail);
    await page.fill('input[id="password"]', 'SecurePass123!');
    await page.fill('input[id="businessName"]', 'My Business');
    await page.fill('input[id="abn"]', '51 824 753 556');
    await page.selectOption('select[id="timezone"]', 'Australia/Melbourne');

    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/.*\/dashboard/, { timeout: 10000 });
  });

  test('invalid ABN shows error', async ({ page }) => {
    await page.goto('/signup');

    // Generate unique email for this test run
    const uniqueEmail = `test-invalid-${Date.now()}@example.com`;

    await page.fill('input[id="email"]', uniqueEmail);
    await page.fill('input[id="password"]', 'SecurePass123!');
    await page.fill('input[id="businessName"]', 'My Business');
    await page.fill('input[id="abn"]', '12345678901');
    await page.selectOption('select[id="timezone"]', 'Australia/Melbourne');

    await page.click('button[type="submit"]');

    const abnError = page.locator('text=Invalid ABN');
    await expect(abnError).toBeVisible({ timeout: 5000 });

    await expect(page).toHaveURL('/signup');
  });
});