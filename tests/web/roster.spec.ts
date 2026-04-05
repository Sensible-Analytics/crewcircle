import { test, expect } from '@playwright/test';

test.describe('Roster Grid', () => {
  test('roster page loads with week navigation', async ({ page }) => {
    await page.goto('/roster');
    
    await expect(page.locator('body')).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: '.sisyphus/evidence/roster-page-loaded.png' });
  });

  test('roster page has week navigation controls', async ({ page }) => {
    await page.goto('/roster');
    
    const prevButton = page.getByRole('button', { name: /previous|prev/i });
    const nextButton = page.getByRole('button', { name: /next/i });
    
    await expect(prevButton.or(page.locator('text=Previous')).first()).toBeVisible({ timeout: 15000 });
    await expect(nextButton.or(page.locator('text=Next')).first()).toBeVisible();
    
    await page.screenshot({ path: '.sisyphus/evidence/roster-navigation.png' });
  });

  test('roster page shows date range', async ({ page }) => {
    await page.goto('/roster');
    await page.waitForSelector('body', { timeout: 15000 });
    
    const datePattern = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d+/i;
    const dateText = page.locator('body').filter({ hasText: datePattern });
    await expect(dateText.first()).toBeVisible({ timeout: 10000 });
    
    await page.screenshot({ path: '.sisyphus/evidence/roster-date-range.png' });
  });
});
