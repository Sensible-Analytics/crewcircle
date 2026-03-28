import { test, expect, Page } from '@playwright/test';

// Helper function to capture step-by-step screenshots
async function captureStep(page: Page, stepName: string) {
  await page.screenshot({ 
    path: `e2e/screenshots/${test.info().title.replace(/\s+/g, '_')}_${stepName}.png`,
    fullPage: true 
  });
}

test.describe('Signup Flow', () => {
  test('signup page loads and shows form', async ({ page }) => {
    await page.goto('/signup');
    await captureStep(page, '00_page_loaded');
    await expect(page.locator('h1')).toContainText('Create your account');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="businessName"]')).toBeVisible();
    await expect(page.locator('input[name="abn"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await captureStep(page, '01_form_visible');
  });

  test('signup shows Google OAuth button', async ({ page }) => {
    await page.goto('/signup');
    await captureStep(page, '00_signup_page');
    const googleBtn = page.locator('button:has-text("Continue with Google")');
    await expect(googleBtn).toBeVisible();
    await captureStep(page, '01_google_button');
  });

  test('signup Google button has correct icon', async ({ page }) => {
    await page.goto('/signup');
    const googleBtn = page.locator('button:has-text("Continue with Google")');
    const svgIcon = googleBtn.locator('svg');
    await expect(svgIcon).toBeVisible();
  });

  test('signup form shows divider between Google and email', async ({ page }) => {
    await page.goto('/signup');
    await expect(page.locator('div.relative span:has-text("or")')).toBeVisible();
  });

  test('signup ABN field shows optional label', async ({ page }) => {
    await page.goto('/signup');
    const abnLabel = page.locator('label[for="abn"]');
    await expect(abnLabel).toContainText('optional for free trial');
  });

  test('signup validation shows errors for empty fields', async ({ page }) => {
    await page.goto('/signup');
    await captureStep(page, '00_signup_page');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid email')).toBeVisible();
    await captureStep(page, '01_validation_error');
  });

  test('signup validation shows error for invalid email', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('input[name="email"]', 'not-an-email');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=email')).toBeVisible();
    await captureStep(page, '00_invalid_email_error');
  });

  test('signup validation shows error for weak password', async ({ page }) => {
    await page.goto('/signup');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'weak');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=at least 8 characters')).toBeVisible();
    await captureStep(page, '00_weak_password_error');
  });

  test('signup shows link to login page', async ({ page }) => {
    await page.goto('/signup');
    await captureStep(page, '00_signup_page');
    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink).toBeVisible();
    await expect(loginLink).toContainText('Sign in');
    await captureStep(page, '01_login_link');
  });

  test('signup uses orange theme', async ({ page }) => {
    await page.goto('/signup');
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toHaveClass(/bg-orange-500/);
  });

  test('signup Logo component is visible', async ({ page }) => {
    await page.goto('/signup');
    const logoLink = page.locator('a[href="/"]');
    await expect(logoLink).toBeVisible();
    await expect(logoLink).toContainText('Crew');
    await expect(logoLink).toContainText('Circle');
  });
});

test.describe('Login Flow', () => {
  test('login page loads and shows form', async ({ page }) => {
    await page.goto('/login');
    await captureStep(page, '00_page_loaded');
    await expect(page.locator('h1')).toContainText('Welcome back');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await captureStep(page, '01_form_visible');
  });

  test('login shows Google OAuth button', async ({ page }) => {
    await page.goto('/login');
    await captureStep(page, '00_login_page');
    const googleBtn = page.locator('button:has-text("Continue with Google")');
    await expect(googleBtn).toBeVisible();
    await captureStep(page, '01_google_button');
  });

  test('login Google button has correct icon', async ({ page }) => {
    await page.goto('/login');
    const googleBtn = page.locator('button:has-text("Continue with Google")');
    const svgIcon = googleBtn.locator('svg');
    await expect(svgIcon).toBeVisible();
  });

  test('login form shows divider between Google and email', async ({ page }) => {
    await page.goto('/login');
    const divider = page.locator('span:has-text("or")');
    await expect(divider).toBeVisible();
  });

  test('login validation shows error for empty fields', async ({ page }) => {
    await page.goto('/login');
    await captureStep(page, '00_login_page');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid email')).toBeVisible();
    await captureStep(page, '01_validation_error');
  });

  test('login shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'nonexistent@test123456.com');
    await page.fill('input[name="password"]', 'wrongpassword123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid')).toBeVisible();
    await captureStep(page, '00_invalid_credentials_error');
  });

  test('login shows link to signup page', async ({ page }) => {
    await page.goto('/login');
    await captureStep(page, '00_login_page');
    const signupLink = page.locator('a[href="/signup"]');
    await expect(signupLink).toBeVisible();
    await expect(signupLink).toContainText('Start free trial');
    await captureStep(page, '01_signup_link');
  });

  test('forgot password link is visible', async ({ page }) => {
    await page.goto('/login');
    await captureStep(page, '00_login_page');
    await expect(page.locator('a[href="/forgot-password"]')).toBeVisible();
    await captureStep(page, '01_forgot_password_link');
  });

  test('login uses orange theme', async ({ page }) => {
    await page.goto('/login');
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toHaveClass(/bg-orange-500/);
  });

  test('login Logo component is visible', async ({ page }) => {
    await page.goto('/login');
    const logoLink = page.locator('a[href="/"]');
    await expect(logoLink).toBeVisible();
    await expect(logoLink).toContainText('Crew');
    await expect(logoLink).toContainText('Circle');
  });
});

test.describe('Navigation from Landing Page', () => {
  test('signup link in nav works', async ({ page }) => {
    await page.goto('/');
    await captureStep(page, '00_landing_page');
    await page.click('a[href="/signup"]');
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.locator('h1')).toContainText('Create your account');
    await captureStep(page, '01_signup_page');
  });

  test('login link in nav works', async ({ page }) => {
    await page.goto('/');
    await captureStep(page, '00_landing_page');
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1')).toContainText('Welcome back');
    await captureStep(page, '01_login_page');
  });

  test('Try Demo button is visible on landing page', async ({ page }) => {
    await page.goto('/');
    await captureStep(page, '00_landing_page');
    const tryDemoBtn = page.locator('a[href="/demo"]');
    await expect(tryDemoBtn).toBeVisible();
    await expect(tryDemoBtn).toContainText('Try Demo');
    await captureStep(page, '01_try_demo_visible');
  });

  test('Try Demo button navigates to demo page', async ({ page }) => {
    await page.goto('/');
    await captureStep(page, '00_landing_page');
    await page.click('a[href="/demo"]');
    await expect(page).toHaveURL(/\/demo/);
    await expect(page.locator('h1')).toContainText('Try CrewCircle Demo');
    await captureStep(page, '01_demo_page');
  });

  test('Logo in nav links to home', async ({ page }) => {
    await page.goto('/login');
    await captureStep(page, '00_login_page');
    const logoLink = page.locator('a[href="/"]').first();
    await logoLink.click();
    await expect(page).toHaveURL(/\/$/);
    await captureStep(page, '01_home_page');
  });
});
