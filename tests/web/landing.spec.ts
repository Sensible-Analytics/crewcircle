import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('landing page loads with correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/CrewCircle/);
    await page.screenshot({ path: '.sisyphus/evidence/landing-page.png' });
  });

  test('landing page has CTA button', async ({ page }) => {
    await page.goto('/');
    const cta = page.getByRole('link', { name: /start free|get started|sign up|try/i });
    await expect(cta.first()).toBeVisible({ timeout: 10000 });
  });

  test('landing page shows pricing information', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/free/i).first()).toBeVisible();
    await expect(page.getByText(/\$4/)).toBeVisible();
  });

  test('privacy policy page loads', async ({ page }) => {
    await page.goto('/privacy');
    await expect(page.getByText(/Privacy Act/i)).toBeVisible();
    await page.screenshot({ path: '.sisyphus/evidence/privacy-page.png' });
  });

  test('terms of service page loads', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.getByText(/terms/i).first()).toBeVisible();
    await page.screenshot({ path: '.sisyphus/evidence/terms-page.png' });
  });

  test('landing page is mobile responsive', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    
    const overflow = await page.evaluate(() =>
      document.documentElement.scrollWidth > document.documentElement.clientWidth
    );
    expect(overflow).toBe(false);
    await page.screenshot({ path: '.sisyphus/evidence/landing-mobile.png' });
  });
});
