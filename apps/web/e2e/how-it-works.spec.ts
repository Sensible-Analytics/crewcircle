import { test, expect, Page } from '@playwright/test';

test.describe('How It Works Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('How It Works section is visible on landing page', async ({ page }) => {
    const section = page.locator('section:has-text("How it works")');
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
  });

  test('Owners journey section displays Maria', async ({ page }) => {
    await page.locator('h3:has-text("Maria\'s Journey")').first().scrollIntoViewIfNeeded();
    await expect(page.locator('h3:has-text("Maria\'s Journey")').first()).toBeVisible();
    await expect(page.locator('text=The Owner')).toBeVisible();
  });

  test('Employee journey section displays Jake', async ({ page }) => {
    await page.locator('h3:has-text("Jake\'s Journey")').first().scrollIntoViewIfNeeded();
    await expect(page.locator('h3:has-text("Jake\'s Journey")').first()).toBeVisible();
    await expect(page.locator('text=The Employee')).toBeVisible();
  });

  test('Owner journey - Sign Up Free step is displayed', async ({ page }) => {
    await page.locator('h3:has-text("Maria\'s Journey")').first().scrollIntoViewIfNeeded();
    await expect(page.locator('text=Sign Up Free').first()).toBeVisible();
    await expect(page.locator('text=Enter your email & business name').first()).toBeVisible();
    await expect(page.locator('text=No ABN needed for trial!').first()).toBeVisible();
  });

  test('Owner journey - Build Roster step is displayed', async ({ page }) => {
    await page.locator('h3:has-text("Maria\'s Journey")').first().scrollIntoViewIfNeeded();
    await expect(page.locator('text=Build Roster').first()).toBeVisible();
    await expect(page.locator('text=Drag & drop shifts').first()).toBeVisible();
  });

  test('Owner journey - Publish Roster step is displayed', async ({ page }) => {
    await page.locator('h3:has-text("Maria\'s Journey")').first().scrollIntoViewIfNeeded();
    await expect(page.locator('text=Publish Roster').first()).toBeVisible();
    await expect(page.locator('text=One click sends roster').first()).toBeVisible();
  });

  test('Owner journey - Track Hours step is displayed', async ({ page }) => {
    await page.locator('h3:has-text("Maria\'s Journey")').first().scrollIntoViewIfNeeded();
    await expect(page.locator('text=Track Hours').first()).toBeVisible();
    await expect(page.locator('text=Export to CSV').first()).toBeVisible();
  });

  test('Employee journey - Get Invited step is displayed', async ({ page }) => {
    await page.locator('h3:has-text("Jake\'s Journey")').first().scrollIntoViewIfNeeded();
    await expect(page.locator('text=Get Invited').first()).toBeVisible();
    await expect(page.locator('text=Owner sends invite')).toBeVisible();
  });

  test('Employee journey - View Roster step is displayed', async ({ page }) => {
    await page.locator('h3:has-text("Jake\'s Journey")').first().scrollIntoViewIfNeeded();
    await expect(page.locator('text=View Roster').first()).toBeVisible();
    await expect(page.locator('text=See upcoming shifts').first()).toBeVisible();
  });

  test('Employee journey - Clock In step is displayed', async ({ page }) => {
    await page.locator('h3:has-text("Jake\'s Journey")').first().scrollIntoViewIfNeeded();
    await expect(page.locator('text=Clock In').first()).toBeVisible();
    await expect(page.locator('text=Tap to clock in').first()).toBeVisible();
  });

  test('Employee journey - Get Notified step is displayed', async ({ page }) => {
    await page.locator('h3:has-text("Jake\'s Journey")').first().scrollIntoViewIfNeeded();
    await expect(page.locator('text=Get Notified').first()).toBeVisible();
    await expect(page.locator('text=Instant alerts').first()).toBeVisible();
  });

  test('Summary section displays correct messaging', async ({ page }) => {
    await page.locator('text=Owner?').first().scrollIntoViewIfNeeded();
    await expect(page.locator('text=Owner?').first()).toBeVisible();
    await expect(page.locator('text=Employee?').first()).toBeVisible();
    await expect(page.locator('text=Both free during 14-day trial').first()).toBeVisible();
    await expect(page.locator('text=No credit card needed').first()).toBeVisible();
  });
});

test.describe('Demo Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Demo section is visible with See it in action tag', async ({ page }) => {
    const section = page.locator('section:has-text("See it in action")');
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeVisible();
    await expect(page.locator('text=See it in action')).toBeVisible();
  });

  test('Demo shows roster creation workflow', async ({ page }) => {
    const section = page.locator('section:has-text("See it in action")');
    await section.scrollIntoViewIfNeeded();
    await expect(page.locator('text=Roster your week in minutes')).toBeVisible();
  });

  test('Demo shows team notification message', async ({ page }) => {
    const section = page.locator('section:has-text("See it in action")');
    await section.scrollIntoViewIfNeeded();
    await expect(page.locator('text=Your team gets notified instantly')).toBeVisible();
  });
});

test.describe('New Features Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Features section has updated heading', async ({ page }) => {
    const section = page.locator('#features');
    await section.scrollIntoViewIfNeeded();
    await expect(page.locator('h2:has-text("No more roster dramas")')).toBeVisible();
  });

  test('Features display Aussie scenarios - Sorted roster', async ({ page }) => {
    const section = page.locator('#features');
    await section.scrollIntoViewIfNeeded();
    await expect(page.locator('h3:has-text("Sorted your roster by Friday arvo")')).toBeVisible();
  });

  test('Features display Aussie scenarios - Clock in from phone', async ({ page }) => {
    const section = page.locator('#features');
    await section.scrollIntoViewIfNeeded();
    await expect(page.locator('h3:has-text("Clock in from their phone")')).toBeVisible();
  });

  test('Features display Aussie scenarios - Award stuff sorted', async ({ page }) => {
    const section = page.locator('#features');
    await section.scrollIntoViewIfNeeded();
    await expect(page.locator('h3:has-text("Award stuff sorted")')).toBeVisible();
  });

  test('Features display Aussie scenarios - Team sees updates', async ({ page }) => {
    const section = page.locator('#features');
    await section.scrollIntoViewIfNeeded();
    await expect(page.locator('h3:has-text("Team sees updates instantly")')).toBeVisible();
  });

  test('Features display Aussie scenarios - Timesheets', async ({ page }) => {
    const section = page.locator('#features');
    await section.scrollIntoViewIfNeeded();
    await expect(page.locator('h3:has-text("Timesheets in one click")')).toBeVisible();
  });

  test('Features display Aussie scenarios - Know your team', async ({ page }) => {
    const section = page.locator('#features');
    await section.scrollIntoViewIfNeeded();
    await expect(page.locator('h3:has-text("Know your team")')).toBeVisible();
  });
});

test.describe('Testimonials Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Testimonials section displays', async ({ page }) => {
    const section = page.locator('section:has-text("What other small biz owners say")');
    await section.scrollIntoViewIfNeeded();
    await expect(page.locator('h2:has-text("What other small biz owners say")')).toBeVisible();
  });

  test('Maria testimonial is displayed', async ({ page }) => {
    const section = page.locator('section:has-text("What other small biz owners say")');
    await section.scrollIntoViewIfNeeded();
    await expect(page.locator('text=Maria Papadopoulos')).toBeVisible();
    await expect(page.locator('text=Cafe owner, Fitzroy VIC')).toBeVisible();
  });

  test('Dave testimonial is displayed', async ({ page }) => {
    const section = page.locator('section:has-text("What other small biz owners say")');
    await section.scrollIntoViewIfNeeded();
    await expect(page.locator('text=Dave Mitchell')).toBeVisible();
    await expect(page.locator('text=Plumbing business, Newcastle NSW')).toBeVisible();
  });

  test('Jenny testimonial is displayed', async ({ page }) => {
    const section = page.locator('section:has-text("What other small biz owners say")');
    await section.scrollIntoViewIfNeeded();
    await expect(page.locator('text=Jenny Chen')).toBeVisible();
    await expect(page.locator('text=Restaurant manager, Sydney NSW')).toBeVisible();
  });
});

test.describe('Pricing Section - Updated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Pricing section has updated heading', async ({ page }) => {
    const section = page.locator('#pricing');
    await section.scrollIntoViewIfNeeded();
    await expect(page.locator('h2:has-text("Pricing that won\'t make you cry")')).toBeVisible();
  });

  test('Free plan is displayed with correct details', async ({ page }) => {
    const section = page.locator('#pricing');
    await section.scrollIntoViewIfNeeded();
    await expect(page.locator('h3:has-text("Free")')).toBeVisible();
    await expect(page.locator('text=For the little guys starting out')).toBeVisible();
    await expect(page.locator('text=Up to 5 employees')).toBeVisible();
    await expect(page.locator('text=Start for Free')).toBeVisible();
  });

  test('Starter plan is displayed with correct pricing', async ({ page }) => {
    const section = page.locator('#pricing');
    await section.scrollIntoViewIfNeeded();
    await expect(page.locator('h3:has-text("Starter")')).toBeVisible();
    await expect(page.locator('text=$4')).toBeVisible();
    await expect(page.locator('text=+ GST / employee / mo')).toBeVisible();
  });
});

test.describe('Hero Section - Updated', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Hero has updated headline with Aussie wording', async ({ page }) => {
    const h1 = page.locator('h1');
    await expect(h1).toContainText('Finally, rostering that');
    await expect(h1).toContainText('gets sorted');
  });

  test('Hero has cafe team image', async ({ page }) => {
    const img = page.locator('img[alt*="cafe"]');
    await expect(img).toBeVisible();
  });

  test('Hero shows tagline about cafes, shops & tradies', async ({ page }) => {
    await expect(page.locator('text=Built for Aussie cafes, shops & tradies')).toBeVisible();
  });

  test('Hero section has no dramas copy', async ({ page }) => {
    await expect(page.locator('text=Stop fighting with WhatsApp chains')).toBeVisible();
  });

  test('CTA button "Start Your Free Trial" visible', async ({ page }) => {
    const cta = page.locator('a:has-text("Start Your Free Trial")').first();
    await expect(cta).toBeVisible();
  });

  test('Try Demo button visible', async ({ page }) => {
    const btn = page.locator('a:has-text("Try Demo")');
    await expect(btn).toBeVisible();
  });
});

test.describe('Social Proof Section', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Social proof shows Aussie businesses', async ({ page }) => {
    await expect(page.locator('text=Loved by businesses across Australia')).toBeVisible();
    await expect(page.locator('text=Melbourne Cafes')).toBeVisible();
    await expect(page.locator('text=Sydney Restaurants')).toBeVisible();
    await expect(page.locator('text=Brisbane Retail')).toBeVisible();
    await expect(page.locator('text=Perth Tradies')).toBeVisible();
  });
});