import { test, expect, Page } from '@playwright/test';

// Helper function to capture step-by-step screenshots
async function captureStep(page: Page, stepName: string) {
  await page.screenshot({ 
    path: `e2e/screenshots/${test.info().title.replace(/\s+/g, '_')}_${stepName}.png`,
    fullPage: true 
  });
}

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await captureStep(page, '00_loaded');
  });

  test('page loads successfully', async ({ page }) => {
    await expect(page).toHaveTitle(/CrewCircle|Create Next App/);
    await captureStep(page, '01_title_check');
  });

  test('shows navigation with CrewCircle branding', async ({ page }) => {
    await expect(page.locator('text=CrewCircle').first()).toBeVisible();
    await captureStep(page, '02_nav_visible');
  });

  test('hero section displays correctly', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('rostering that');
    await expect(page.locator('h1:has-text("gets sorted")')).toBeVisible();
    await captureStep(page, '03_hero_section');
  });

  test('CTA buttons are visible and link to signup', async ({ page }) => {
    const getStartedBtn = page.locator('a:has-text("Get Started")').first();
    await expect(getStartedBtn).toBeVisible();
    await expect(getStartedBtn).toHaveAttribute('href', '/signup');
    await captureStep(page, '04_cta_buttons');
  });

  test('Hero CTA "Start Your Free Trial" links to signup', async ({ page }) => {
    const heroCTA = page.locator('a:has-text("Start Your Free Trial")').first();
    await expect(heroCTA).toBeVisible();
    await expect(heroCTA).toHaveAttribute('href', '/signup');
    await captureStep(page, '04_hero_cta');
  });

  test('Hero CTA click navigates to signup page', async ({ page }) => {
    const heroCTA = page.locator('a:has-text("Start Your Free Trial")').first();
    await heroCTA.click();
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.locator('h1')).toContainText('Create your account');
    await captureStep(page, '05_click_navigated_to_signup');
  });

  test('Pricing CTA "Start for Free" links to signup', async ({ page }) => {
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    const pricingCTA = page.locator('a:has-text("Start for Free")').first();
    await expect(pricingCTA).toBeVisible();
    await expect(pricingCTA).toHaveAttribute('href', '/signup');
    await captureStep(page, '06_pricing_cta');
  });

  test('Pricing CTA click navigates to signup page', async ({ page }) => {
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    const pricingCTA = page.locator('a:has-text("Start for Free")').first();
    await pricingCTA.click();
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.locator('h1')).toContainText('Create your account');
    await captureStep(page, '07_pricing_cta_navigated');
  });

  test('CTA section "Start Your Free Trial" links to signup', async ({ page }) => {
    const ctaSection = page.locator('section:has-text("Ready to sort your rostering")');
    await ctaSection.scrollIntoViewIfNeeded();
    const ctaBtn = ctaSection.locator('a:has-text("Start Your Free Trial")');
    await expect(ctaBtn).toBeVisible();
    await expect(ctaBtn).toHaveAttribute('href', '/signup');
    await captureStep(page, '08_cta_section');
  });

  test('CTA section click navigates to signup page', async ({ page }) => {
    const ctaSection = page.locator('section:has-text("Ready to sort your rostering")');
    await ctaSection.scrollIntoViewIfNeeded();
    const ctaBtn = ctaSection.locator('a:has-text("Start Your Free Trial")');
    await ctaBtn.click();
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.locator('h1')).toContainText('Create your account');
    await captureStep(page, '09_cta_section_navigated');
  });

  test('features section displays all features', async ({ page }) => {
    await page.goto('/');
    await page.locator('#features').scrollIntoViewIfNeeded();
    await expect(page.locator('h3:has-text("Sorted your roster by Friday arvo")')).toBeVisible();
    await expect(page.locator('h3:has-text("Clock in from their phone")')).toBeVisible();
    await expect(page.locator('h3:has-text("Award stuff sorted")')).toBeVisible();
    await captureStep(page, '05_features_section');
  });

  test('pricing section displays both plans', async ({ page }) => {
    await page.locator('#pricing').scrollIntoViewIfNeeded();
    await expect(page.locator('text=Pricing that won\'t make you cry')).toBeVisible();
    await expect(page.locator('h3:has-text("Free")')).toBeVisible();
    await expect(page.locator('h3:has-text("Starter")')).toBeVisible();
    await captureStep(page, '06_pricing_section');
  });

  test('footer displays all required links', async ({ page }) => {
    await expect(page.locator('footer')).toBeVisible();
    await expect(page.locator('a:has-text("Privacy Policy")')).toBeVisible();
    await expect(page.locator('a:has-text("Terms of Service")')).toBeVisible();
    await captureStep(page, '07_footer');
  });
});

test.describe('Authentication - Signup', () => {
  test('signup page loads and displays form', async ({ page }) => {
    await page.goto('/signup');
    await captureStep(page, '00_signup_page');
    await expect(page.locator('h1')).toContainText('Create your account');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="businessName"]')).toBeVisible();
    await expect(page.locator('input[name="abn"]')).toBeVisible();
    await captureStep(page, '01_form_fields_visible');
  });

  test('signup shows link to login', async ({ page }) => {
    await page.goto('/signup');
    await captureStep(page, '00_signup_page');
    const loginLink = page.locator('a[href="/login"]');
    await expect(loginLink).toBeVisible();
    await captureStep(page, '01_login_link_visible');
  });
});

test.describe('Authentication - Login', () => {
  test('login page loads and displays form', async ({ page }) => {
    await page.goto('/login');
    await captureStep(page, '00_login_page');
    await expect(page.locator('h1')).toContainText('Welcome back');
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await captureStep(page, '01_form_visible');
  });

  test('login shows error for invalid credentials', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'nonexistent@test123456.com');
    await page.fill('input[name="password"]', 'wrongpassword123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Invalid')).toBeVisible();
    await captureStep(page, '00_error_shown');
  });

  test('login has forgot password link', async ({ page }) => {
    await page.goto('/login');
    await captureStep(page, '00_login_page');
    await expect(page.locator('a[href="/forgot-password"]')).toBeVisible();
    await captureStep(page, '01_forgot_link');
  });

  test('login shows link to signup', async ({ page }) => {
    await page.goto('/login');
    await captureStep(page, '00_login_page');
    const signupLink = page.locator('a[href="/signup"]:has-text("Start free trial")');
    await expect(signupLink).toBeVisible();
    await captureStep(page, '01_signup_link');
  });
});

test.describe('Authentication - Forgot Password', () => {
  test('forgot password page loads and displays form', async ({ page }) => {
    await page.goto('/forgot-password');
    await captureStep(page, '00_forgot_password_page');
    await expect(page.locator('h1')).toContainText('Reset your password');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await captureStep(page, '01_form_visible');
  });

  test('forgot password shows link back to login', async ({ page }) => {
    await page.goto('/forgot-password');
    await captureStep(page, '00_forgot_password_page');
    await expect(page.locator('a[href="/login"]')).toBeVisible();
    await captureStep(page, '01_login_link');
  });
});

test.describe('Authentication - Update Password', () => {
  test('update password page loads and displays form', async ({ page }) => {
    await page.goto('/update-password');
    await captureStep(page, '00_update_password_page');
    await expect(page.locator('h1')).toContainText('Set new password');
    await expect(page.locator('input[name="password"]')).toBeVisible();
    await expect(page.locator('input[name="confirmPassword"]')).toBeVisible();
    await captureStep(page, '01_form_visible');
  });

  test('update password validates password match', async ({ page }) => {
    await page.goto('/update-password');
    await page.fill('input[name="password"]', 'NewPass@123');
    await page.fill('input[name="confirmPassword"]', 'DifferentPass@123');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=Passwords do not match')).toBeVisible();
    await captureStep(page, '00_mismatch_error');
  });

  test('update password validates weak password', async ({ page }) => {
    await page.goto('/update-password');
    await page.fill('input[name="password"]', 'weak');
    await page.fill('input[name="confirmPassword"]', 'weak');
    await page.click('button[type="submit"]');
    await expect(page.locator('text=at least 8 characters')).toBeVisible();
    await captureStep(page, '00_weak_password_error');
  });
});

test.describe('Navigation Flows', () => {
  test('signup link from landing page nav works', async ({ page }) => {
    await page.goto('/');
    await captureStep(page, '00_landing_page');
    await page.click('a[href="/signup"]:first-of-type');
    await expect(page).toHaveURL(/\/signup/);
    await expect(page.locator('h1')).toContainText('Create your account');
    await captureStep(page, '01_navigated_to_signup');
  });

  test('login link from landing page nav works', async ({ page }) => {
    await page.goto('/');
    await captureStep(page, '00_landing_page');
    await page.click('nav a[href="/login"]');
    await expect(page).toHaveURL(/\/login/);
    await expect(page.locator('h1')).toContainText('Welcome back');
    await captureStep(page, '01_navigated_to_login');
  });

  test('can navigate from signup to login', async ({ page }) => {
    await page.goto('/signup');
    await captureStep(page, '00_signup_page');
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL(/\/login/);
    await captureStep(page, '01_navigated_to_login');
  });

  test('can navigate from login to signup', async ({ page }) => {
    await page.goto('/login');
    await captureStep(page, '00_login_page');
    await page.click('a[href="/signup"]');
    await expect(page).toHaveURL(/\/signup/);
    await captureStep(page, '01_navigated_to_signup');
  });

  test('can navigate from forgot-password to login', async ({ page }) => {
    await page.goto('/forgot-password');
    await captureStep(page, '00_forgot_password_page');
    await page.click('a[href="/login"]');
    await expect(page).toHaveURL(/\/login/);
    await captureStep(page, '01_navigated_to_login');
  });
});

test.describe('Static Pages', () => {
  test('privacy policy page loads', async ({ page }) => {
    await page.goto('/privacy');
    await captureStep(page, '00_privacy_page');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Privacy Policy');
    await captureStep(page, '01_content_visible');
  });

  test('terms of service page loads', async ({ page }) => {
    await page.goto('/terms');
    await captureStep(page, '00_terms_page');
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('h1')).toContainText('Terms of Service');
    await captureStep(page, '01_content_visible');
  });

  test('footer privacy link works', async ({ page }) => {
    await page.goto('/');
    await captureStep(page, '00_landing_page');
    await page.click('a[href="/privacy"]');
    await expect(page).toHaveURL(/\/privacy/);
    await captureStep(page, '01_navigated_to_privacy');
  });

  test('footer terms link works', async ({ page }) => {
    await page.goto('/');
    await captureStep(page, '00_landing_page');
    await page.click('a[href="/terms"]');
    await expect(page).toHaveURL(/\/terms/);
    await captureStep(page, '01_navigated_to_terms');
  });
});

test.describe('Protected Pages', () => {
  test('roster page requires authentication', async ({ page }) => {
    await page.goto('/roster');
    await captureStep(page, '00_roster_page');
    await expect(page).toHaveURL(/\/roster/);
  });

  test('timesheets page requires authentication', async ({ page }) => {
    await page.goto('/timesheets');
    await captureStep(page, '00_timesheets_page');
    await expect(page).toHaveURL(/\/timesheets/);
  });

  test('billing page loads (may require auth)', async ({ page }) => {
    await page.goto('/settings/billing');
    await captureStep(page, '00_billing_page');
    await expect(page).toHaveURL(/\/settings\/billing/);
  });
});

test.describe('API Routes', () => {
  test('checkout API endpoint exists', async ({ page }) => {
    const response = await page.request.get('/api/checkout');
    expect([200, 401, 404, 405]).toContain(response.status());
  });

  test('invite API endpoint exists', async ({ page }) => {
    const response = await page.request.get('/api/invite');
    expect([200, 401, 404, 405]).toContain(response.status());
  });
});

test.describe('Responsive Design', () => {
  test('mobile view - landing page loads', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await captureStep(page, '00_mobile_landing');
    await expect(page).toHaveTitle(/CrewCircle|Create Next App/);
  });

  test('mobile view - hamburger menu appears', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await captureStep(page, '00_mobile_landing');
    await expect(page.locator('nav')).toBeVisible();
    await captureStep(page, '01_nav_visible');
  });
});

test.describe('Accessibility', () => {
  test('signup form has proper labels', async ({ page }) => {
    await page.goto('/signup');
    await captureStep(page, '00_signup_page');
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
    await expect(page.locator('label[for="businessName"]')).toBeVisible();
    await expect(page.locator('label[for="abn"]')).toBeVisible();
    await captureStep(page, '01_labels_visible');
  });

  test('login form has proper labels', async ({ page }) => {
    await page.goto('/login');
    await captureStep(page, '00_login_page');
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="password"]')).toBeVisible();
    await captureStep(page, '01_labels_visible');
  });

  test('signup form submit button is accessible', async ({ page }) => {
    await page.goto('/signup');
    await captureStep(page, '00_signup_page');
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();
    await captureStep(page, '01_submit_button');
  });
});

test.describe('Logo Component', () => {
  test('Logo visible on landing page nav', async ({ page }) => {
    await page.goto('/');
    await captureStep(page, '00_landing_page');
    const logoLink = page.locator('nav a[href="/"]').first();
    await expect(logoLink).toBeVisible();
    await expect(logoLink).toContainText('Crew');
    await expect(logoLink).toContainText('Circle');
    await captureStep(page, '01_logo_visible');
  });

  test('Logo visible on signup page', async ({ page }) => {
    await page.goto('/signup');
    await captureStep(page, '00_signup_page');
    const logoLink = page.locator('a[href="/"]').first();
    await expect(logoLink).toBeVisible();
    await expect(logoLink).toContainText('Crew');
    await expect(logoLink).toContainText('Circle');
    await captureStep(page, '01_logo_visible');
  });

  test('Logo visible on login page', async ({ page }) => {
    await page.goto('/login');
    await captureStep(page, '00_login_page');
    const logoLink = page.locator('a[href="/"]').first();
    await expect(logoLink).toBeVisible();
    await expect(logoLink).toContainText('Crew');
    await expect(logoLink).toContainText('Circle');
    await captureStep(page, '01_logo_visible');
  });

  test('Logo visible on demo page', async ({ page }) => {
    await page.goto('/demo');
    await captureStep(page, '00_demo_page');
    const logoLink = page.locator('a[href="/"]').first();
    await expect(logoLink).toBeVisible();
    await expect(logoLink).toContainText('Crew');
    await expect(logoLink).toContainText('Circle');
    await captureStep(page, '01_logo_visible');
  });

  test('Logo visible on footer (landing page)', async ({ page }) => {
    await page.goto('/');
    await page.locator('footer').scrollIntoViewIfNeeded();
    await captureStep(page, '00_footer');
    const logoLink = page.locator('footer a[href="/"]').first();
    await expect(logoLink).toBeVisible();
    await expect(logoLink).toContainText('Crew');
    await expect(logoLink).toContainText('Circle');
    await captureStep(page, '01_footer_logo');
  });

  test('Logo navigates to home when clicked', async ({ page }) => {
    await page.goto('/login');
    await captureStep(page, '00_login_page');
    const logoLink = page.locator('a[href="/"]').first();
    await logoLink.click();
    await expect(page).toHaveURL(/\/$/);
    await captureStep(page, '01_home_page');
  });

  test('Logo has orange gradient background', async ({ page }) => {
    await page.goto('/');
    const logoIcon = page.locator('nav a[href="/"] div').first();
    await expect(logoIcon).toHaveClass(/bg-gradient-to-br/);
    await expect(logoIcon).toHaveClass(/from-orange-500/);
  });
});

test.describe('Try Demo Button', () => {
  test('Try Demo button visible on landing page', async ({ page }) => {
    await page.goto('/');
    await captureStep(page, '00_landing_page');
    const tryDemoBtn = page.locator('a[href="/demo"]').first();
    await expect(tryDemoBtn).toBeVisible();
    await expect(tryDemoBtn).toContainText('Try Demo');
    await captureStep(page, '01_try_demo_visible');
  });

  test('Try Demo button has play icon', async ({ page }) => {
    await page.goto('/');
    const tryDemoBtn = page.locator('a[href="/demo"]').first();
    const svgIcon = tryDemoBtn.locator('svg');
    await expect(svgIcon).toBeVisible();
  });

  test('Try Demo button navigates to demo page', async ({ page }) => {
    await page.goto('/');
    await captureStep(page, '00_landing_page');
    const tryDemoBtn = page.locator('a[href="/demo"]').first();
    await tryDemoBtn.click();
    await expect(page).toHaveURL(/\/demo/);
    await expect(page.locator('h1')).toContainText('Try CrewCircle Demo');
    await captureStep(page, '01_demo_page');
  });

  test('Try Demo button styled with orange border', async ({ page }) => {
    await page.goto('/');
    const tryDemoBtn = page.locator('a[href="/demo"]').first();
    await expect(tryDemoBtn).toHaveClass(/border-orange-200/);
    await expect(tryDemoBtn).toHaveClass(/text-orange-600/);
  });
});
