import { test, expect, Page } from '@playwright/test';

async function captureStep(page: Page, stepName: string) {
  await page.screenshot({ 
    path: `e2e/screenshots/${test.info().title.replace(/\s+/g, '_')}_${stepName}.png`,
    fullPage: true 
  });
}

test.describe('Signup Flow', () => {
  test('signup page loads and shows Clerk SignUp component', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_page_loaded');
    await expect(page.locator('h1')).toContainText('Create your account');
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
    await captureStep(page, '01_clerk_component');
  });

  test('signup shows Google OAuth button', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_signup_page');
    const googleBtn = page.locator('button:has-text("Continue with Google")');
    await expect(googleBtn).toBeVisible();
    await captureStep(page, '01_google_button');
  });

  test('signup page has email field', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    const emailInput = page.locator('input[placeholder*="email"]').first();
    await expect(emailInput).toBeVisible();
    await captureStep(page, '01_email_field');
  });

  test('signup page has password field', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();
    await captureStep(page, '01_password_field');
  });

  test('signup shows link to login page', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_signup_page');
    const loginLink = page.locator('a:has-text("Sign in")').first();
    await expect(loginLink).toBeVisible();
    await captureStep(page, '01_login_link');
  });

  test('signup Logo component is visible', async ({ page }) => {
    await page.goto('/signup');
    await page.waitForLoadState('networkidle');
    const logoLink = page.locator('a[href="/"]').first();
    await expect(logoLink).toBeVisible();
    await captureStep(page, '01_logo');
  });
});

test.describe('Login Flow', () => {
  test('login page loads and shows Clerk SignIn component', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_page_loaded');
    await expect(page.locator('button:has-text("Continue with Google")')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
    await captureStep(page, '01_clerk_component');
  });

  test('login shows Google OAuth button', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_login_page');
    const googleBtn = page.locator('button:has-text("Continue with Google")');
    await expect(googleBtn).toBeVisible();
    await captureStep(page, '01_google_button');
  });

  test('login page has email field', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const emailInput = page.locator('input[placeholder*="email"]').first();
    await expect(emailInput).toBeVisible();
    await captureStep(page, '01_email_field');
  });

  test('login page has password field', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();
    await captureStep(page, '01_password_field');
  });

  test('login shows link to signup page', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_login_page');
    const signupLink = page.locator('a:has-text("Sign up")').first();
    await expect(signupLink).toBeVisible();
    await captureStep(page, '01_signup_link');
  });

  test('forgot password page is accessible', async ({ page }) => {
    await page.goto('/forgot-password');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('body')).toBeVisible();
    await captureStep(page, '01_forgot_password_page');
  });

  test('login Logo component is visible', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    const logoLink = page.locator('a[href="/"]').first();
    await expect(logoLink).toBeVisible();
    await captureStep(page, '01_logo');
  });
});

test.describe('Demo Login Flow', () => {
  test('demo-login page without token redirects to /demo', async ({ page }) => {
    await page.goto('/demo-login');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/\/demo-login/, { timeout: 5000 });
    await captureStep(page, '00_demo_login_no_token');
  });

  test('demo-login with token shows loading and redirects to /roster', async ({ page }) => {
    await page.goto('/demo-login?token=test&role=Owner&tenantId=test&email=test@test.com');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/roster/, { timeout: 5000 });
    await captureStep(page, '00_with_token');
  });
});

test.describe('Navigation from Landing Page', () => {
  test('signup link in nav works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_landing_page');
    const signupLink = page.locator('a[href="/signup"]').first();
    await expect(signupLink).toBeVisible();
    await signupLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/signup/);
    await captureStep(page, '01_signup_page');
  });

  test('login link in nav works', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_landing_page');
    const loginLink = page.locator('a[href="/login"]').first();
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/login/);
    await captureStep(page, '01_login_page');
  });

  test('Try Demo button is visible on landing page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_landing_page');
    const tryDemoBtn = page.locator('a[href="/demo"]');
    await expect(tryDemoBtn).toBeVisible();
    await captureStep(page, '01_try_demo_visible');
  });

  test('Try Demo button navigates to demo page', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_landing_page');
    const tryDemoBtn = page.locator('a[href="/demo"]');
    await tryDemoBtn.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/demo/);
    await captureStep(page, '01_demo_page');
  });

  test('Logo in nav links to home', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_login_page');
    const logoLink = page.locator('a[href="/"]').first();
    await logoLink.click();
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/\/$/);
    await captureStep(page, '01_home_page');
  });
});
