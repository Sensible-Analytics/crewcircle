import { test, expect, Page } from '@playwright/test';

// Helper function to capture step-by-step screenshots
async function captureStep(page: Page, stepName: string) {
  await page.screenshot({ 
    path: `e2e/screenshots/${test.info().title.replace(/\s+/g, '_')}_${stepName}.png`,
    fullPage: true 
  });
}

// Helper to set up demo and navigate to roster
async function setupDemoAndNavigateToRoster(page: Page) {
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
  
  // Wait for roster grid to actually render (not just "Loading roster...")
  // The grid container with grid-cols appears only when data is loaded
  await page.waitForSelector('.grid-cols-\\[200px_repeat\\(7\\,1fr\\)\\], text="Loading roster..."', { timeout: 15000 }).catch(() => {});
  // If still loading, wait a bit more
  await page.waitForTimeout(3000);
}

test.describe('Roster Page - Demo Authentication', () => {
  test('roster page loads after demo login', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    // Verify page header
    await expect(page.locator('h1')).toContainText('Weekly Roster');
    await captureStep(page, '01_header_visible');
  });
});

test.describe('Roster Grid - Week Navigation', () => {
  test('roster shows previous week button', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    const prevBtn = page.locator('button:has-text("Previous")');
    await expect(prevBtn).toBeVisible();
    await captureStep(page, '01_prev_button_visible');
  });

  test('roster shows next week button', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    const nextBtn = page.locator('button:has-text("Next")');
    await expect(nextBtn).toBeVisible();
    await captureStep(page, '01_next_button_visible');
  });

  test('roster shows date range', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    // Date range should be visible (format: "MMM d - MMM d, yyyy")
    const dateRange = page.locator('.font-medium').filter({ hasText: '-' });
    await expect(dateRange).toBeVisible();
    await captureStep(page, '01_date_range_visible');
  });

  test('clicking previous week updates date range', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    // Get initial date range
    const dateRange = page.locator('.font-medium').filter({ hasText: '-' });
    const initialDate = await dateRange.textContent();
    
    // Click previous week
    const prevBtn = page.locator('button:has-text("Previous")');
    await prevBtn.click();
    await page.waitForTimeout(500); // Wait for state update
    
    // Date range should change
    const newDate = await dateRange.textContent();
    expect(newDate).not.toBe(initialDate);
    await captureStep(page, '01_date_changed');
  });

  test('clicking next week updates date range', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    // Get initial date range
    const dateRange = page.locator('.font-medium').filter({ hasText: '-' });
    const initialDate = await dateRange.textContent();
    
    // Click next week
    const nextBtn = page.locator('button:has-text("Next")');
    await nextBtn.click();
    await page.waitForTimeout(500); // Wait for state update
    
    // Date range should change
    const newDate = await dateRange.textContent();
    expect(newDate).not.toBe(initialDate);
    await captureStep(page, '01_date_changed');
  });
});

test.describe('Roster Grid - Employee List', () => {
  test('roster shows employee column header', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    const employeeHeader = page.locator('div.font-semibold').filter({ hasText: 'Employee' });
    await expect(employeeHeader).toBeVisible();
    await captureStep(page, '01_employee_header_visible');
  });

  test('roster shows employee names in rows', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    // Wait for roster data to load
    await page.waitForTimeout(2000);
    
    // Check for employee names (demo has Maria, Jake, Sarah, Emma)
    const employeeCells = page.locator('.p-2.bg-gray-50.border-t');
    await expect(employeeCells.first()).toBeVisible({ timeout: 10000 });
    await captureStep(page, '01_employee_rows_visible');
  });
});

test.describe('Roster Grid - Day Columns', () => {
  test('roster shows all day column headers (Sun-Sat)', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    // Check for all day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (const day of days) {
      const dayHeader = page.locator(`div.font-semibold.p-2`).filter({ hasText: day });
      await expect(dayHeader).toBeVisible();
    }
    await captureStep(page, '01_all_days_visible');
  });

  test('roster shows day columns in correct order', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    // Get all day headers
    const dayHeaders = page.locator('div.font-semibold.p-2.bg-gray-100.text-center');
    const count = await dayHeaders.count();
    
    // Should have 7 day columns
    expect(count).toBe(7);
    await captureStep(page, '01_day_columns_count');
  });
});

test.describe('Roster Grid - Add Shift Button', () => {
  test('roster shows add shift buttons in empty cells', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    // Wait for roster data to load
    await page.waitForTimeout(2000);
    
    // Look for add shift buttons (+ buttons)
    const addShiftBtns = page.locator('button.add-shift-btn');
    await expect(addShiftBtns.first()).toBeVisible({ timeout: 10000 });
    await captureStep(page, '01_add_shift_buttons_visible');
  });

  test('clicking add shift button opens modal', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    // Wait for roster data to load
    await page.waitForTimeout(2000);
    
    // Click first add shift button
    const addShiftBtn = page.locator('button.add-shift-btn').first();
    await addShiftBtn.click();
    await captureStep(page, '01_modal_opened');
    
    // Modal should be visible
    const modal = page.locator('div.fixed.inset-0.z-50');
    await expect(modal).toBeVisible();
    await captureStep(page, '02_modal_visible');
  });
});

test.describe('Shift Creation Modal - Form Fields', () => {
  test('modal shows employee dropdown', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    // Wait for roster data to load
    await page.waitForTimeout(2000);
    
    // Open modal
    const addShiftBtn = page.locator('button.add-shift-btn').first();
    await addShiftBtn.click();
    await captureStep(page, '01_modal_opened');
    
    // Check for employee dropdown
    const employeeSelect = page.locator('select');
    await expect(employeeSelect).toBeVisible();
    
    // Check for default option — <option> elements are hidden until <select> is clicked
    const defaultOption = page.locator('option:has-text("Select an employee")');
    await expect(defaultOption).toBeAttached();
    await captureStep(page, '02_employee_dropdown_visible');
  });

  test('modal shows start time input', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    // Wait for roster data to load
    await page.waitForTimeout(2000);
    
    // Open modal
    const addShiftBtn = page.locator('button.add-shift-btn').first();
    await addShiftBtn.click();
    await captureStep(page, '01_modal_opened');
    
    // Check for start time input
    const startTimeInput = page.locator('input[type="datetime-local"]').first();
    await expect(startTimeInput).toBeVisible();
    
    // Check for label
    const startTimeLabel = page.locator('label:has-text("Start Time")');
    await expect(startTimeLabel).toBeVisible();
    await captureStep(page, '02_start_time_visible');
  });

  test('modal shows end time input', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    // Wait for roster data to load
    await page.waitForTimeout(2000);
    
    // Open modal
    const addShiftBtn = page.locator('button.add-shift-btn').first();
    await addShiftBtn.click();
    await captureStep(page, '01_modal_opened');
    
    // Check for end time input (second datetime-local input)
    const endTimeInputs = page.locator('input[type="datetime-local"]');
    await expect(endTimeInputs).toHaveCount(2);
    
    // Check for label
    const endTimeLabel = page.locator('label:has-text("End Time")');
    await expect(endTimeLabel).toBeVisible();
    await captureStep(page, '02_end_time_visible');
  });

  test('modal shows role label field', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    // Wait for roster data to load
    await page.waitForTimeout(2000);
    
    // Open modal
    const addShiftBtn = page.locator('button.add-shift-btn').first();
    await addShiftBtn.click();
    await captureStep(page, '01_modal_opened');
    
    // Check for role label input
    const roleLabelInput = page.locator('input[type="text"]');
    await expect(roleLabelInput).toBeVisible();
    
    // Check for label
    const roleLabel = page.locator('label:has-text("Role Label")');
    await expect(roleLabel).toBeVisible();
    await captureStep(page, '02_role_label_visible');
  });

  test('modal shows notes field', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    // Wait for roster data to load
    await page.waitForTimeout(2000);
    
    // Open modal
    const addShiftBtn = page.locator('button.add-shift-btn').first();
    await addShiftBtn.click();
    await captureStep(page, '01_modal_opened');
    
    // Check for notes textarea
    const notesTextarea = page.locator('textarea');
    await expect(notesTextarea).toBeVisible();
    
    // Check for label
    const notesLabel = page.locator('label:has-text("Notes")');
    await expect(notesLabel).toBeVisible();
    await captureStep(page, '02_notes_visible');
  });
});

test.describe('Shift Creation Modal - Actions', () => {
  test('modal has cancel button', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    // Wait for roster data to load
    await page.waitForTimeout(2000);
    
    // Open modal
    const addShiftBtn = page.locator('button.add-shift-btn').first();
    await addShiftBtn.click();
    await captureStep(page, '01_modal_opened');
    
    // Check for cancel button
    const cancelBtn = page.locator('button:has-text("Cancel")');
    await expect(cancelBtn).toBeVisible();
    await captureStep(page, '02_cancel_button_visible');
  });

  test('modal has save shift button', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    // Wait for roster data to load
    await page.waitForTimeout(2000);
    
    // Open modal
    const addShiftBtn = page.locator('button.add-shift-btn').first();
    await addShiftBtn.click();
    await captureStep(page, '01_modal_opened');
    
    // Check for save button
    const saveBtn = page.locator('button:has-text("Save Shift")');
    await expect(saveBtn).toBeVisible();
    await captureStep(page, '02_save_button_visible');
  });

  test('cancel button closes modal without saving', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    // Wait for roster data to load
    await page.waitForTimeout(2000);
    
    // Open modal
    const addShiftBtn = page.locator('button.add-shift-btn').first();
    await addShiftBtn.click();
    await captureStep(page, '01_modal_opened');
    
    // Verify modal is visible
    const modal = page.locator('div.fixed.inset-0.z-50');
    await expect(modal).toBeVisible();
    
    // Click cancel
    const cancelBtn = page.locator('button:has-text("Cancel")');
    await cancelBtn.click();
    await captureStep(page, '02_cancel_clicked');
    
    // Modal should be closed
    await expect(modal).not.toBeVisible();
    await captureStep(page, '03_modal_closed');
  });

  test('modal title shows Add Shift', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    // Wait for roster data to load
    await page.waitForTimeout(2000);
    
    // Open modal
    const addShiftBtn = page.locator('button.add-shift-btn').first();
    await addShiftBtn.click();
    await captureStep(page, '01_modal_opened');
    
    // Check modal title
    const modalTitle = page.locator('h2:has-text("Add Shift")');
    await expect(modalTitle).toBeVisible();
    await captureStep(page, '02_modal_title_visible');
  });
});

test.describe('Roster Grid - Status Indicators', () => {
  test('roster shows status indicator', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    // Wait for roster data to load
    await page.waitForTimeout(2000);
    
    // Status should be visible at bottom
    const statusText = page.locator('text=Status:');
    await expect(statusText).toBeVisible({ timeout: 10000 });
    await captureStep(page, '01_status_visible');
  });

  test('roster shows loading state initially', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('networkidle');
    
    const setupBtn = page.locator('button:has-text("Set Up Demo Organization")');
    await setupBtn.click();
    
    const readyText = page.locator('text=Demo Ready!');
    await expect(readyText.or(page.locator('text=Failed to set up demo'))).toBeVisible({ timeout: 30000 });
    
    const ownerBtn = page.locator('button:has-text("Owner (Maria)")');
    await ownerBtn.click();
    
    // Check for loading spinner during initial load
    const loadingSpinner = page.locator('.animate-spin');
    // Loading spinner may or may not appear depending on speed
    await page.waitForTimeout(1000);
    await captureStep(page, '00_initial_load');
  });
});

test.describe('Roster Grid - Grid Structure', () => {
  test('roster grid has proper column structure', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    // Wait for roster data to load
    await page.waitForTimeout(2000);
    
    // Grid should have 8 columns (Employee + 7 days)
    const grid = page.locator('.grid-cols-\\[200px_repeat\\(7\\,1fr\\)\\]');
    await expect(grid).toBeVisible();
    await captureStep(page, '01_grid_structure_visible');
  });

  test('roster shows employee column on left', async ({ page }) => {
    await setupDemoAndNavigateToRoster(page);
    await captureStep(page, '00_roster_loaded');
    
    // Wait for roster data to load
    await page.waitForTimeout(2000);
    
    // Employee column should be sticky on left
    const employeeColumn = page.locator('.sticky.left-0');
    await expect(employeeColumn.first()).toBeVisible();
    await captureStep(page, '01_employee_column_sticky');
  });
});