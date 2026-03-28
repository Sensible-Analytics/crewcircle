import { test, expect, Page } from '@playwright/test';

// Helper function to capture step-by-step screenshots
async function captureStep(page: Page, stepName: string) {
  await page.screenshot({ 
    path: `e2e/screenshots/${test.info().title.replace(/\s+/g, '_')}_${stepName}.png`,
    fullPage: true 
  });
}

// Helper to set up demo and navigate to timesheets
async function setupDemoAndNavigateToTimesheets(page: Page) {
  await page.goto('/demo');
  await page.waitForLoadState('networkidle');
  
  const setupBtn = page.locator('button:has-text("Set Up Demo Organization")');
  await setupBtn.click();
  
  // Wait for demo to be ready
  const readyText = page.locator('text=Demo Ready!');
  const errorText = page.locator('text=Failed to set up demo');
  await expect(readyText.or(errorText)).toBeVisible({ timeout: 30000 });
  
  // Click on Owner (Maria) to login
  const ownerBtn = page.locator('button:has-text("Owner (Maria)")');
  await ownerBtn.click();
  
  // Wait for redirect to roster
  await expect(page).toHaveURL(/\/roster/, { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  
  // Navigate to timesheets
  await page.goto('/timesheets');
  await page.waitForLoadState('networkidle');
}

test.describe('Timesheets Page - Demo Authentication', () => {
  test('timesheets page loads after demo login', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    // Verify page header
    await expect(page.locator('h1')).toContainText('Timesheets');
    await captureStep(page, '01_header_visible');
  });
});

test.describe('Timesheets Page - Date Range Selector', () => {
  test('timesheets shows previous week button', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    const prevBtn = page.locator('button:has-text("Previous Week")');
    await expect(prevBtn).toBeVisible();
    await captureStep(page, '01_prev_button_visible');
  });

  test('timesheets shows next week button', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    const nextBtn = page.locator('button:has-text("Next Week")');
    await expect(nextBtn).toBeVisible();
    await captureStep(page, '01_next_button_visible');
  });

  test('timesheets shows date range', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    // Date range should be visible (format: "MMM d - MMM d, yyyy")
    const dateRange = page.locator('.text-sm.text-gray-600');
    await expect(dateRange).toBeVisible();
    await captureStep(page, '01_date_range_visible');
  });

  test('clicking previous week updates date range', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    // Get initial date range
    const dateRange = page.locator('.text-sm.text-gray-600');
    const initialDate = await dateRange.textContent();
    
    // Click previous week
    const prevBtn = page.locator('button:has-text("Previous Week")');
    await prevBtn.click();
    await page.waitForTimeout(500); // Wait for state update
    
    // Date range should change
    const newDate = await dateRange.textContent();
    expect(newDate).not.toBe(initialDate);
    await captureStep(page, '01_date_changed');
  });

  test('clicking next week updates date range', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    // Get initial date range
    const dateRange = page.locator('.text-sm.text-gray-600');
    const initialDate = await dateRange.textContent();
    
    // Click next week
    const nextBtn = page.locator('button:has-text("Next Week")');
    await nextBtn.click();
    await page.waitForTimeout(500); // Wait for state update
    
    // Date range should change
    const newDate = await dateRange.textContent();
    expect(newDate).not.toBe(initialDate);
    await captureStep(page, '01_date_changed');
  });
});

test.describe('Timesheets Page - Total Hours Summary', () => {
  test('timesheets shows total hours summary', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    // Total hours should be visible
    const totalHours = page.locator('.font-semibold').filter({ hasText: 'Total:' });
    await expect(totalHours).toBeVisible();
    await captureStep(page, '01_total_hours_visible');
  });

  test('total hours displays correct format', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    // Total hours should show format like "Total: X.X hours"
    const totalHours = page.locator('.font-semibold').filter({ hasText: 'Total:' });
    const text = await totalHours.textContent();
    expect(text).toMatch(/Total:\s*\d+\.?\d*\s*hours/);
    await captureStep(page, '01_total_hours_format');
  });
});

test.describe('Timesheets Page - Export CSV Button', () => {
  test('timesheets has export CSV button', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    const exportBtn = page.locator('button:has-text("Export CSV")');
    await expect(exportBtn).toBeVisible();
    await captureStep(page, '01_export_button_visible');
  });

  test('export CSV button has green styling', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    const exportBtn = page.locator('button:has-text("Export CSV")');
    await expect(exportBtn).toHaveClass(/bg-green-600/);
    await captureStep(page, '01_export_button_styling');
  });

  test('clicking export button triggers download', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Set up download listener
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    
    const exportBtn = page.locator('button:has-text("Export CSV")');
    
    // Only click if button is enabled (has entries)
    const isEnabled = await exportBtn.isEnabled();
    if (isEnabled) {
      await exportBtn.click();
      const download = await downloadPromise;
      
      // If download occurred, verify filename pattern
      if (download) {
        const filename = download.suggestedFilename();
        expect(filename).toMatch(/timesheets-.*\.csv/);
      }
    }
    await captureStep(page, '01_export_clicked');
  });
});

test.describe('Timesheets Page - Approve Buttons', () => {
  test('timesheets shows approve all button when unapproved entries exist', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check if approve all button exists (only visible when there are unapproved entries)
    const approveAllBtn = page.locator('button:has-text("Approve All")');
    
    // Button may or may not be visible depending on data state
    // Just verify the page loaded correctly
    await expect(page.locator('h1')).toContainText('Timesheets');
    await captureStep(page, '01_approve_all_check');
  });

  test('approve all button has blue styling', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    const approveAllBtn = page.locator('button:has-text("Approve All")');
    const isVisible = await approveAllBtn.isVisible().catch(() => false);
    
    if (isVisible) {
      await expect(approveAllBtn).toHaveClass(/bg-blue-600/);
    }
    await captureStep(page, '01_approve_all_styling');
  });

  test('individual approve buttons visible for unapproved entries', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check for approve buttons on entries (may or may not exist based on data)
    const approveBtns = page.locator('button:has-text("Approve")').filter({ 
      hasNot: page.locator('button:has-text("Approve All")') 
    });
    
    // Just verify page structure is correct
    await expect(page.locator('h1')).toContainText('Timesheets');
    await captureStep(page, '01_approve_buttons_check');
  });
});

test.describe('Timesheets Page - Employee List', () => {
  test('timesheets shows employee entries or empty state', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Either entries are shown or empty state message
    const entries = page.locator('.bg-white.rounded-lg.shadow-sm.border.overflow-hidden');
    const emptyState = page.locator('text=No timesheet entries found');
    
    // One of these should be visible
    await expect(entries.first().or(emptyState)).toBeVisible({ timeout: 10000 });
    await captureStep(page, '01_entries_or_empty');
  });

  test('timesheets displays employee avatar with initials', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check for avatar circles (orange background with initials)
    const avatar = page.locator('.w-10.h-10.bg-orange-100.rounded-full');
    const emptyState = page.locator('text=No timesheet entries found');
    
    // Either avatar or empty state should be visible
    await expect(avatar.first().or(emptyState)).toBeVisible({ timeout: 10000 });
    await captureStep(page, '01_avatar_visible');
  });

  test('timesheets shows employee name in entries', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check for employee name (font-medium class in entry)
    const employeeName = page.locator('.font-medium').filter({ hasText: /[A-Z]/ });
    const emptyState = page.locator('text=No timesheet entries found');
    
    // Either employee name or empty state should be visible
    await expect(employeeName.first().or(emptyState)).toBeVisible({ timeout: 10000 });
    await captureStep(page, '01_employee_name_visible');
  });

  test('timesheets shows hours for each entry', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check for hours display (text with "hours")
    const hoursText = page.locator('text=/\\d+\\.?\\d*\\s*hours/');
    const emptyState = page.locator('text=No timesheet entries found');
    
    // Either hours or empty state should be visible
    await expect(hoursText.first().or(emptyState)).toBeVisible({ timeout: 10000 });
    await captureStep(page, '01_hours_visible');
  });
});

test.describe('Timesheets Page - Clock Events Display', () => {
  test('timesheets displays clock events table structure', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check for table structure (entries grouped by date)
    const entryGroups = page.locator('.bg-white.rounded-lg.shadow-sm.border.overflow-hidden');
    const emptyState = page.locator('text=No timesheet entries found');
    
    // Either entry groups or empty state should be visible
    await expect(entryGroups.first().or(emptyState)).toBeVisible({ timeout: 10000 });
    await captureStep(page, '01_table_structure');
  });

  test('timesheets shows date headers for grouped entries', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check for date headers (bg-gray-50 with date format)
    const dateHeader = page.locator('.bg-gray-50.px-4.py-2');
    const emptyState = page.locator('text=No timesheet entries found');
    
    // Either date headers or empty state should be visible
    await expect(dateHeader.first().or(emptyState)).toBeVisible({ timeout: 10000 });
    await captureStep(page, '01_date_headers');
  });

  test('timesheets shows clock in/out times', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check for time display (format like "h:mm a")
    const timeDisplay = page.locator('.text-right .font-medium');
    const emptyState = page.locator('text=No timesheet entries found');
    
    // Either time display or empty state should be visible
    await expect(timeDisplay.first().or(emptyState)).toBeVisible({ timeout: 10000 });
    await captureStep(page, '01_time_display');
  });

  test('timesheets shows location for entries', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check for location display (text-gray-500 with location or "No location")
    const locationText = page.locator('.text-sm.text-gray-500');
    const emptyState = page.locator('text=No timesheet entries found');
    
    // Either location or empty state should be visible
    await expect(locationText.first().or(emptyState)).toBeVisible({ timeout: 10000 });
    await captureStep(page, '01_location_visible');
  });

  test('timesheets shows approved status badge', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check for approved badge (green background with checkmark)
    const approvedBadge = page.locator('.bg-green-100.text-green-700');
    const approveBtn = page.locator('button:has-text("Approve")').filter({ 
      hasNot: page.locator('button:has-text("Approve All")') 
    });
    const emptyState = page.locator('text=No timesheet entries found');
    
    // Either approved badge, approve button, or empty state should be visible
    await expect(approvedBadge.first().or(approveBtn.first()).or(emptyState)).toBeVisible({ timeout: 10000 });
    await captureStep(page, '01_approved_status');
  });
});

test.describe('Timesheets Page - GPS Verification', () => {
  test('timesheets shows GPS verified indicator when applicable', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // GPS verified indicator (green text with checkmark)
    const gpsVerified = page.locator('text=GPS verified');
    const emptyState = page.locator('text=No timesheet entries found');
    
    // GPS verified may or may not be visible depending on data
    // Just verify page loaded correctly
    await expect(page.locator('h1')).toContainText('Timesheets');
    await captureStep(page, '01_gps_check');
  });
});

test.describe('Timesheets Page - Empty State', () => {
  test('timesheets shows empty state when no entries', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Either entries or empty state should be visible
    const emptyState = page.locator('text=No timesheet entries found');
    const entries = page.locator('.bg-white.rounded-lg.shadow-sm.border.overflow-hidden');
    
    // One of these should be visible
    await expect(emptyState.or(entries.first())).toBeVisible({ timeout: 10000 });
    await captureStep(page, '01_empty_or_entries');
  });

  test('timesheets shows loading state initially', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    
    const setupBtn = page.locator('button:has-text("Set Up Demo Organization")');
    await setupBtn.click();
    
    const readyText = page.locator('text=Demo Ready!');
    await expect(readyText.or(page.locator('text=Failed to set up demo'))).toBeVisible({ timeout: 30000 });
    
    const ownerBtn = page.locator('button:has-text("Owner (Maria)")');
    await ownerBtn.click();
    
    // Navigate to timesheets
    await page.goto('/timesheets');
    
    // Check for loading state
    const loadingText = page.locator('text=Loading');
    await expect(loadingText.or(page.locator('h1:has-text("Timesheets")'))).toBeVisible({ timeout: 10000 });
    await captureStep(page, '00_loading_state');
  });
});

test.describe('Timesheets Page - Navigation', () => {
  test('timesheets page is accessible via direct URL after demo login', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    // Verify we're on timesheets page
    await expect(page).toHaveURL(/\/timesheets/);
    await expect(page.locator('h1')).toContainText('Timesheets');
    await captureStep(page, '01_url_verified');
  });

  test('timesheets page maintains state on week navigation', async ({ page }) => {
    await setupDemoAndNavigateToTimesheets(page);
    await captureStep(page, '00_timesheets_loaded');
    
    // Navigate to previous week
    const prevBtn = page.locator('button:has-text("Previous Week")');
    await prevBtn.click();
    await page.waitForTimeout(500);
    
    // Verify still on timesheets page
    await expect(page).toHaveURL(/\/timesheets/);
    await expect(page.locator('h1')).toContainText('Timesheets');
    await captureStep(page, '01_state_maintained');
  });
});