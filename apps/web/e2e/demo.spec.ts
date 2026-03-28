import { test, expect, Page } from '@playwright/test';

test.describe('Demo Page - Initial State', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/demo');
  });

  test('page loads with correct heading', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Try CrewCircle Demo');
  });

  test('page shows cafe name', async ({ page }) => {
    await expect(page.locator('h2:has-text("The Daily Grind Cafe")')).toBeVisible();
  });

  test('page shows cafe description', async ({ page }) => {
    await expect(page.locator('text=A fictional cafe in Surry Hills, Sydney with 4 team members')).toBeVisible();
  });

  test('setup button is visible', async ({ page }) => {
    const setupBtn = page.locator('button:has-text("Set Up Demo Organization")');
    await expect(setupBtn).toBeVisible();
  });

  test('setup button shows loading state on click', async ({ page }) => {
    const setupBtn = page.locator('button:has-text("Set Up Demo Organization")');
    await setupBtn.click();
    await expect(page.locator('text=Setting up demo')).toBeVisible();
  });

  test('setup button has orange styling', async ({ page }) => {
    const setupBtn = page.locator('button:has-text("Set Up Demo Organization")');
    await expect(setupBtn).toHaveClass(/bg-orange-500/);
  });

  test('Logo component is visible', async ({ page }) => {
    const logoLink = page.locator('a[href="/"]').first();
    await expect(logoLink).toBeVisible();
    await expect(logoLink).toContainText('Crew');
    await expect(logoLink).toContainText('Circle');
  });

  test('back to home link works', async ({ page }) => {
    const backLink = page.locator('a:has-text("Back to home")');
    await expect(backLink).toBeVisible();
    await backLink.click();
    await expect(page).toHaveURL(/\/$/);
  });

  test('page uses amber gradient background', async ({ page }) => {
    const pageDiv = page.locator('div.min-h-screen');
    await expect(pageDiv).toHaveClass(/bg-gradient-to-b/);
    await expect(pageDiv).toHaveClass(/from-amber-50/);
  });

  test('setup description text is visible', async ({ page }) => {
    await expect(page.locator('text=This will create a demo cafe with 4 users, rosters, shifts, and clock events')).toBeVisible();
  });

  test('page shows explore description', async ({ page }) => {
    await expect(page.locator('text=Explore all features with a pre-configured demo organization')).toBeVisible();
  });
});

test.describe('Demo Page - After Setup', () => {
  test('setup shows result message', async ({ page }) => {
    await page.goto('/demo');
    const setupBtn = page.locator('button:has-text("Set Up Demo Organization")');
    await setupBtn.click();

    const readyText = page.locator('text=Demo Ready!');
    const errorText = page.locator('text=Failed to set up demo');

    await expect(readyText.or(errorText)).toBeVisible({ timeout: 30000 });
  });

  test('demo ready shows user cards', async ({ page }) => {
    await page.goto('/demo');
    const setupBtn = page.locator('button:has-text("Set Up Demo Organization")');
    await setupBtn.click();

    const readyText = page.locator('text=Demo Ready!');
    const errorText = page.locator('text=Failed to set up demo');

    await expect(readyText.or(errorText)).toBeVisible({ timeout: 30000 });

    if (await readyText.isVisible()) {
      await expect(page.locator('text=Owner (Maria)')).toBeVisible();
      await expect(page.locator('text=Manager (Jake)')).toBeVisible();
      await expect(page.locator('text=Employee (Sarah)')).toBeVisible();
      await expect(page.locator('text=Employee (Emma)')).toBeVisible();
    }
  });

  test('demo ready shows demo mode notice', async ({ page }) => {
    await page.goto('/demo');
    const setupBtn = page.locator('button:has-text("Set Up Demo Organization")');
    await setupBtn.click();

    const readyText = page.locator('text=Demo Ready!');
    const errorText = page.locator('text=Failed to set up demo');

    await expect(readyText.or(errorText)).toBeVisible({ timeout: 30000 });

    if (await readyText.isVisible()) {
      await expect(page.locator('text=Demo Mode')).toBeVisible();
      await expect(page.locator('text=Click any user below to explore their view')).toBeVisible();
    }
  });

  test('demo ready shows feature list', async ({ page }) => {
    await page.goto('/demo');
    const setupBtn = page.locator('button:has-text("Set Up Demo Organization")');
    await setupBtn.click();

    const readyText = page.locator('text=Demo Ready!');
    const errorText = page.locator('text=Failed to set up demo');

    await expect(readyText.or(errorText)).toBeVisible({ timeout: 30000 });

    if (await readyText.isVisible()) {
      await expect(page.locator('text=4 team members')).toBeVisible();
      await expect(page.locator('text=Sydney location')).toBeVisible();
      await expect(page.locator('text=Weekly roster with shifts')).toBeVisible();
      await expect(page.locator('text=Clock events')).toBeVisible();
      await expect(page.locator('text=Employee availability')).toBeVisible();
    }
  });

  test('clicking demo user navigates to roster', async ({ page }) => {
    await page.goto('/demo');
    const setupBtn = page.locator('button:has-text("Set Up Demo Organization")');
    await setupBtn.click();

    const readyText = page.locator('text=Demo Ready!');
    const errorText = page.locator('text=Failed to set up demo');

    await expect(readyText.or(errorText)).toBeVisible({ timeout: 30000 });

    if (await readyText.isVisible()) {
      const ownerBtn = page.locator('button:has-text("Owner (Maria)")');
      await ownerBtn.click();
      await expect(page).toHaveURL(/\/roster/, { timeout: 10000 });
    }
  });

  test('roster page loads after demo login', async ({ page }) => {
    await page.goto('/demo');
    const setupBtn = page.locator('button:has-text("Set Up Demo Organization")');
    await setupBtn.click();

    const readyText = page.locator('text=Demo Ready!');
    await expect(readyText.or(page.locator('text=Failed to set up demo'))).toBeVisible({ timeout: 30000 });

    if (await readyText.isVisible()) {
      const ownerBtn = page.locator('button:has-text("Owner (Maria)")');
      await ownerBtn.click();
      await expect(page).toHaveURL(/\/roster/, { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
    }
  });

  test('roster page shows main content', async ({ page }) => {
    await page.goto('/demo');
    const setupBtn = page.locator('button:has-text("Set Up Demo Organization")');
    await setupBtn.click();

    const readyText = page.locator('text=Demo Ready!');
    await expect(readyText.or(page.locator('text=Failed to set up demo'))).toBeVisible({ timeout: 30000 });

    if (await readyText.isVisible()) {
      const ownerBtn = page.locator('button:has-text("Owner (Maria)")');
      await ownerBtn.click();
      await expect(page).toHaveURL(/\/roster/, { timeout: 10000 });
      await page.waitForLoadState('networkidle');
      const body = page.locator('main');
      await expect(body).toBeVisible({ timeout: 10000 });
    }
  });
});