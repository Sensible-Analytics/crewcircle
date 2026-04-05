import type { Page } from '@playwright/test';

export async function loginViaDemo(page: Page, role: 'owner' | 'manager' | 'employee1' | 'employee2' = 'owner') {
  const DEMO_USERS = {
    owner: 'demo-owner@crewcircle.co',
    manager: 'demo-manager@crewcircle.co',
    employee1: 'demo-employee1@crewcircle.co',
    employee2: 'demo-employee2@crewcircle.co',
  };
  
  await page.goto('/demo');
  await page.waitForSelector('button:has-text("Set Up Demo Organization")', { timeout: 15000 });
  await page.click('button:has-text("Set Up Demo Organization")');
  await page.waitForSelector('text=Demo Ready!', { timeout: 30000 });
  
  const email = DEMO_USERS[role];
  const userButton = page.locator(`button:has-text("${email}")`);
  await userButton.click();
  
  await page.waitForURL(/\/(roster|dashboard)/, { timeout: 30000 });
}

export async function loginViaClerk(page: Page, email: string, password: string) {
  await page.goto('/login');
  
  try {
    await page.waitForSelector('[data-testid="clerk-sign-in"]', { timeout: 10000 });
  } catch {
    throw new Error('Clerk sign-in component not found. Clerk keys may not be configured.');
  }
  
  const emailInput = page.locator('input[name="identifier"]');
  await emailInput.fill(email);
  await page.getByRole('button', { name: /continue|next/i }).click();
  
  await page.waitForSelector('input[name="password"]', { timeout: 10000 });
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: /continue|sign in/i }).click();
  
  await page.waitForURL(/\/(roster|dashboard)/, { timeout: 30000 });
}

export async function signupViaClerk(page: Page, email: string, password: string) {
  await page.goto('/signup');
  
  try {
    await page.waitForSelector('[data-testid="clerk-sign-up"]', { timeout: 10000 });
  } catch {
    throw new Error('Clerk sign-up component not found. Clerk keys may not be configured.');
  }
  
  const emailInput = page.locator('input[name="identifier"]');
  await emailInput.fill(email);
  await page.getByRole('button', { name: /continue|next/i }).click();
  
  await page.waitForSelector('input[name="password"]', { timeout: 10000 });
  await page.locator('input[name="password"]').fill(password);
  await page.getByRole('button', { name: /continue|sign up/i }).click();
  
  await page.waitForURL(/\/(roster|dashboard)/, { timeout: 30000 });
}

export async function logout(page: Page) {
  await page.goto('/profile');
  
  const signOutButton = page.getByRole('button', { name: /sign out|logout/i });
  if (await signOutButton.isVisible()) {
    await signOutButton.click();
    await page.waitForURL(/\/(login|$)/, { timeout: 10000 });
  }
}

export async function clearAuthState(page: Page) {
  await page.context().clearCookies();
  await page.context().clearPermissions();
}
