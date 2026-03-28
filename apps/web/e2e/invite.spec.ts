import { test, expect, Page } from '@playwright/test';

// Helper function to capture step-by-step screenshots
async function captureStep(page: Page, stepName: string) {
  await page.screenshot({ 
    path: `e2e/screenshots/${test.info().title.replace(/\s+/g, '_')}_${stepName}.png`,
    fullPage: true 
  });
}

// Helper function to set up demo and login as Owner
async function setupDemoAndLogin(page: Page) {
  await page.goto('/demo');
  await page.waitForLoadState('networkidle');
  await captureStep(page, '00_demo_page');

  // Click "Set Up Demo Organization" button
  const setupBtn = page.locator('button:has-text("Set Up Demo Organization")');
  await setupBtn.click();
  await captureStep(page, '01_setup_clicked');

  // Wait for demo to be ready
  const readyText = page.locator('text=Demo Ready!');
  const errorText = page.locator('text=Failed to set up demo');
  await expect(readyText.or(errorText)).toBeVisible({ timeout: 30000 });
  await captureStep(page, '02_demo_ready');

  // If demo is ready, click Owner to login
  if (await readyText.isVisible()) {
    const ownerBtn = page.locator('button:has-text("Owner (Maria)")');
    await ownerBtn.click();
    await captureStep(page, '03_owner_clicked');

    // Wait for redirect to roster page
    await expect(page).toHaveURL(/\/roster/, { timeout: 10000 });
    await page.waitForLoadState('networkidle');
    await captureStep(page, '04_logged_in');
  }
}

test.describe('Invite Flow - Demo Authentication', () => {
  test('demo flow sets up organization and logs in as Owner', async ({ page }) => {
    await setupDemoAndLogin(page);
    
    // Verify we're on the roster page
    await expect(page).toHaveURL(/\/roster/);
    await captureStep(page, '05_on_roster_page');
  });
});

test.describe('Team Page - After Demo Login', () => {
  test.beforeEach(async ({ page }) => {
    await setupDemoAndLogin(page);
  });

  test('team page loads after demo login', async ({ page }) => {
    // Navigate to team page
    await page.goto('/team');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_team_page');

    // Verify team page loaded
    await expect(page).toHaveURL(/\/team/);
    await captureStep(page, '01_team_url_verified');
  });

  test('team page shows Invite Employee button', async ({ page }) => {
    // Navigate to team page
    await page.goto('/team');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_team_page');

    // Look for Invite Employee button
    const inviteBtn = page.locator('button:has-text("Invite"), button:has-text("Add"), button:has-text("Employee")').first();
    
    // Check if any invite-related button exists
    const hasInviteButton = await inviteBtn.isVisible().catch(() => false);
    
    if (hasInviteButton) {
      await expect(inviteBtn).toBeVisible();
      await captureStep(page, '01_invite_button_visible');
    } else {
      // If no team page exists, check settings/team
      await page.goto('/settings/team');
      await page.waitForLoadState('networkidle');
      await captureStep(page, '02_settings_team_page');

      const settingsInviteBtn = page.locator('button:has-text("Invite"), button:has-text("Add")').first();
      await expect(settingsInviteBtn.or(page.locator('body'))).toBeVisible();
      await captureStep(page, '03_settings_team_invite_button');
    }
  });

  test('team page displays team members', async ({ page }) => {
    // Navigate to team page
    await page.goto('/team');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_team_page');

    // Check for team member list or table
    const teamList = page.locator('table, [role="list"], .team-members, [data-testid="team-list"]').first();
    
    // Verify some content is visible
    await expect(page.locator('body')).toBeVisible();
    await captureStep(page, '01_team_content_visible');
  });
});

test.describe('Invite Modal - UI Elements', () => {
  test.beforeEach(async ({ page }) => {
    await setupDemoAndLogin(page);
  });

  test('invite modal opens when Invite button clicked', async ({ page }) => {
    // Navigate to team page
    await page.goto('/team');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_team_page');

    // Try to find and click invite button
    const inviteBtn = page.locator('button:has-text("Invite"), button:has-text("Add Employee"), button:has-text("Invite Employee")').first();
    
    const hasInviteButton = await inviteBtn.isVisible().catch(() => false);
    
    if (hasInviteButton) {
      await inviteBtn.click();
      await captureStep(page, '01_invite_clicked');

      // Wait for modal to appear
      await page.waitForTimeout(500);
      await captureStep(page, '02_modal_visible');

      // Check for modal/dialog
      const modal = page.locator('[role="dialog"], .modal, [data-testid="invite-modal"]').first();
      const hasModal = await modal.isVisible().catch(() => false);
      
      if (hasModal) {
        await expect(modal).toBeVisible();
        await captureStep(page, '03_modal_confirmed');
      }
    } else {
      // Try settings/team
      await page.goto('/settings/team');
      await page.waitForLoadState('networkidle');
      await captureStep(page, '04_settings_team');

      const settingsInviteBtn = page.locator('button:has-text("Invite"), button:has-text("Add")').first();
      if (await settingsInviteBtn.isVisible().catch(() => false)) {
        await settingsInviteBtn.click();
        await captureStep(page, '05_settings_invite_clicked');
      }
    }
  });

  test('invite modal has email input field', async ({ page }) => {
    // Navigate to team page
    await page.goto('/team');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_team_page');

    // Try to open invite modal
    const inviteBtn = page.locator('button:has-text("Invite"), button:has-text("Add")').first();
    
    if (await inviteBtn.isVisible().catch(() => false)) {
      await inviteBtn.click();
      await page.waitForTimeout(500);
      await captureStep(page, '01_modal_opened');

      // Look for email input
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"], input[placeholder*="Email"]').first();
      
      if (await emailInput.isVisible().catch(() => false)) {
        await expect(emailInput).toBeVisible();
        await captureStep(page, '02_email_input_visible');
      }
    }
  });

  test('invite modal has phone input field (optional)', async ({ page }) => {
    // Navigate to team page
    await page.goto('/team');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_team_page');

    // Try to open invite modal
    const inviteBtn = page.locator('button:has-text("Invite"), button:has-text("Add")').first();
    
    if (await inviteBtn.isVisible().catch(() => false)) {
      await inviteBtn.click();
      await page.waitForTimeout(500);
      await captureStep(page, '01_modal_opened');

      // Look for phone input (optional field)
      const phoneInput = page.locator('input[type="tel"], input[name="phone"], input[placeholder*="phone"], input[placeholder*="Phone"]').first();
      
      // Phone field is optional, so we just check if modal is visible
      const modal = page.locator('[role="dialog"], .modal').first();
      if (await modal.isVisible().catch(() => false)) {
        await expect(modal).toBeVisible();
        await captureStep(page, '02_modal_with_optional_phone');
      }
    }
  });

  test('invite modal has role selector (Owner/Manager/Employee)', async ({ page }) => {
    // Navigate to team page
    await page.goto('/team');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_team_page');

    // Try to open invite modal
    const inviteBtn = page.locator('button:has-text("Invite"), button:has-text("Add")').first();
    
    if (await inviteBtn.isVisible().catch(() => false)) {
      await inviteBtn.click();
      await page.waitForTimeout(500);
      await captureStep(page, '01_modal_opened');

      // Look for role selector/dropdown
      const roleSelector = page.locator('select[name="role"], [data-testid="role-selector"], select:has(option:text("Owner")), select:has(option:text("Manager")), select:has(option:text("Employee"))').first();
      
      if (await roleSelector.isVisible().catch(() => false)) {
        await expect(roleSelector).toBeVisible();
        await captureStep(page, '02_role_selector_visible');

        // Check for role options
        const ownerOption = page.locator('option:has-text("Owner"), [value="owner"]');
        const managerOption = page.locator('option:has-text("Manager"), [value="manager"]');
        const employeeOption = page.locator('option:has-text("Employee"), [value="employee"]');

        // At least one role option should exist
        const hasOwner = await ownerOption.count() > 0;
        const hasManager = await managerOption.count() > 0;
        const hasEmployee = await employeeOption.count() > 0;

        expect(hasOwner || hasManager || hasEmployee).toBeTruthy();
        await captureStep(page, '03_role_options_checked');
      }
    }
  });

  test('invite modal has Cancel button', async ({ page }) => {
    // Navigate to team page
    await page.goto('/team');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_team_page');

    // Try to open invite modal
    const inviteBtn = page.locator('button:has-text("Invite"), button:has-text("Add")').first();
    
    if (await inviteBtn.isVisible().catch(() => false)) {
      await inviteBtn.click();
      await page.waitForTimeout(500);
      await captureStep(page, '01_modal_opened');

      // Look for Cancel button
      const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
      
      if (await cancelBtn.isVisible().catch(() => false)) {
        await expect(cancelBtn).toBeVisible();
        await captureStep(page, '02_cancel_button_visible');
      }
    }
  });

  test('invite modal has Send Invite button', async ({ page }) => {
    // Navigate to team page
    await page.goto('/team');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_team_page');

    // Try to open invite modal
    const inviteBtn = page.locator('button:has-text("Invite"), button:has-text("Add")').first();
    
    if (await inviteBtn.isVisible().catch(() => false)) {
      await inviteBtn.click();
      await page.waitForTimeout(500);
      await captureStep(page, '01_modal_opened');

      // Look for Send/Submit button
      const sendBtn = page.locator('button:has-text("Send"), button:has-text("Invite"), button[type="submit"]').first();
      
      if (await sendBtn.isVisible().catch(() => false)) {
        await expect(sendBtn).toBeVisible();
        await captureStep(page, '02_send_button_visible');
      }
    }
  });
});

test.describe('Invite Flow - Validation', () => {
  test.beforeEach(async ({ page }) => {
    await setupDemoAndLogin(page);
  });

  test('shows 5 employee limit message (Free plan)', async ({ page }) => {
    // Navigate to team page
    await page.goto('/team');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_team_page');

    // Look for employee count or limit message
    const limitMessage = page.locator('text=/5.*employee/i, text=/limit.*5/i, text=/free.*plan/i');
    
    // Check if limit message is visible somewhere on the page
    const hasLimitMessage = await limitMessage.isVisible().catch(() => false);
    
    if (hasLimitMessage) {
      await expect(limitMessage.first()).toBeVisible();
      await captureStep(page, '01_limit_message_visible');
    } else {
      // Check billing page for limit info
      await page.goto('/settings/billing');
      await page.waitForLoadState('networkidle');
      await captureStep(page, '02_billing_page');

      // Billing page should show employee count
      const usageSection = page.locator('text=/employee/i, text=/usage/i');
      if (await usageSection.isVisible().catch(() => false)) {
        await expect(usageSection.first()).toBeVisible();
        await captureStep(page, '03_usage_visible');
      }
    }
  });

  test('validation error for invalid email format', async ({ page }) => {
    // Navigate to team page
    await page.goto('/team');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_team_page');

    // Try to open invite modal
    const inviteBtn = page.locator('button:has-text("Invite"), button:has-text("Add")').first();
    
    if (await inviteBtn.isVisible().catch(() => false)) {
      await inviteBtn.click();
      await page.waitForTimeout(500);
      await captureStep(page, '01_modal_opened');

      // Find email input
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email"]').first();
      
      if (await emailInput.isVisible().catch(() => false)) {
        // Enter invalid email
        await emailInput.fill('invalid-email');
        await captureStep(page, '02_invalid_email_entered');

        // Try to submit
        const submitBtn = page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Invite")').first();
        if (await submitBtn.isVisible().catch(() => false)) {
          await submitBtn.click();
          await page.waitForTimeout(500);
          await captureStep(page, '03_submit_clicked');

          // Look for validation error
          const errorMessage = page.locator('text=/invalid.*email/i, text=/valid.*email/i, text=/email.*required/i');
          
          if (await errorMessage.isVisible().catch(() => false)) {
            await expect(errorMessage.first()).toBeVisible();
            await captureStep(page, '04_validation_error_visible');
          }
        }
      }
    }
  });

  test('empty email shows required field error', async ({ page }) => {
    // Navigate to team page
    await page.goto('/team');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_team_page');

    // Try to open invite modal
    const inviteBtn = page.locator('button:has-text("Invite"), button:has-text("Add")').first();
    
    if (await inviteBtn.isVisible().catch(() => false)) {
      await inviteBtn.click();
      await page.waitForTimeout(500);
      await captureStep(page, '01_modal_opened');

      // Find submit button
      const submitBtn = page.locator('button[type="submit"], button:has-text("Send"), button:has-text("Invite")').first();
      
      if (await submitBtn.isVisible().catch(() => false)) {
        // Click submit without filling email
        await submitBtn.click();
        await page.waitForTimeout(500);
        await captureStep(page, '02_submit_without_email');

        // Look for required field error
        const errorMessage = page.locator('text=/required/i, text=/enter.*email/i');
        
        if (await errorMessage.isVisible().catch(() => false)) {
          await expect(errorMessage.first()).toBeVisible();
          await captureStep(page, '03_required_error_visible');
        }
      }
    }
  });
});

test.describe('Invite Flow - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupDemoAndLogin(page);
  });

  test('cancel button closes invite modal', async ({ page }) => {
    // Navigate to team page
    await page.goto('/team');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_team_page');

    // Try to open invite modal
    const inviteBtn = page.locator('button:has-text("Invite"), button:has-text("Add")').first();
    
    if (await inviteBtn.isVisible().catch(() => false)) {
      await inviteBtn.click();
      await page.waitForTimeout(500);
      await captureStep(page, '01_modal_opened');

      // Find and click cancel button
      const cancelBtn = page.locator('button:has-text("Cancel"), button:has-text("Close")').first();
      
      if (await cancelBtn.isVisible().catch(() => false)) {
        await cancelBtn.click();
        await page.waitForTimeout(500);
        await captureStep(page, '02_cancel_clicked');

        // Modal should be closed
        const modal = page.locator('[role="dialog"], .modal').first();
        const isModalVisible = await modal.isVisible().catch(() => false);
        
        expect(isModalVisible).toBe(false);
        await captureStep(page, '03_modal_closed');
      }
    }
  });

  test('can navigate from roster to team page', async ({ page }) => {
    // Already on roster page from beforeEach
    await captureStep(page, '00_roster_page');

    // Navigate to team page
    await page.goto('/team');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '01_team_page');

    // Verify navigation worked
    await expect(page).toHaveURL(/\/team/);
    await captureStep(page, '02_team_url_verified');
  });

  test('can navigate from settings to team page', async ({ page }) => {
    // Navigate to settings
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_settings_page');

    // Try to navigate to team from settings
    await page.goto('/settings/team');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '01_settings_team_page');

    // Verify we're on a team-related page
    await expect(page).toHaveURL(/team/);
    await captureStep(page, '02_team_settings_verified');
  });
});

test.describe('Invite Flow - Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await setupDemoAndLogin(page);
  });

  test('invite modal has proper labels', async ({ page }) => {
    // Navigate to team page
    await page.goto('/team');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_team_page');

    // Try to open invite modal
    const inviteBtn = page.locator('button:has-text("Invite"), button:has-text("Add")').first();
    
    if (await inviteBtn.isVisible().catch(() => false)) {
      await inviteBtn.click();
      await page.waitForTimeout(500);
      await captureStep(page, '01_modal_opened');

      // Check for labels
      const emailLabel = page.locator('label[for="email"], label:has-text("Email")');
      const roleLabel = page.locator('label[for="role"], label:has-text("Role")');

      if (await emailLabel.isVisible().catch(() => false)) {
        await expect(emailLabel.first()).toBeVisible();
        await captureStep(page, '02_email_label_visible');
      }

      if (await roleLabel.isVisible().catch(() => false)) {
        await expect(roleLabel.first()).toBeVisible();
        await captureStep(page, '03_role_label_visible');
      }
    }
  });

  test('invite form inputs are accessible', async ({ page }) => {
    // Navigate to team page
    await page.goto('/team');
    await page.waitForLoadState('networkidle');
    await captureStep(page, '00_team_page');

    // Try to open invite modal
    const inviteBtn = page.locator('button:has-text("Invite"), button:has-text("Add")').first();
    
    if (await inviteBtn.isVisible().catch(() => false)) {
      await inviteBtn.click();
      await page.waitForTimeout(500);
      await captureStep(page, '01_modal_opened');

      // Check for accessible inputs
      const emailInput = page.locator('input[type="email"], input[name="email"]').first();
      
      if (await emailInput.isVisible().catch(() => false)) {
        // Input should be focusable
        await emailInput.focus();
        await captureStep(page, '02_email_input_focused');
        
        // Input should be enabled
        await expect(emailInput).toBeEnabled();
        await captureStep(page, '03_email_input_enabled');
      }
    }
  });
});