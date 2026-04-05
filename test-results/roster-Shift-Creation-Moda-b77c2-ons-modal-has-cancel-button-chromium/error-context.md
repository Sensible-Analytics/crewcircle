# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: roster.spec.ts >> Shift Creation Modal - Actions >> modal has cancel button
- Location: apps/web/e2e/roster.spec.ts:316:7

# Error details

```
Error: page.waitForTimeout: Target page, context or browser has been closed
```

# Test source

```ts
  221 |     const defaultOption = page.locator('option:has-text("Select an employee")');
  222 |     await expect(defaultOption).toBeAttached();
  223 |     await captureStep(page, '02_employee_dropdown_visible');
  224 |   });
  225 | 
  226 |   test('modal shows start time input', async ({ page }) => {
  227 |     await setupDemoAndNavigateToRoster(page);
  228 |     await captureStep(page, '00_roster_loaded');
  229 |     
  230 |     // Wait for roster data to load
  231 |     await page.waitForTimeout(2000);
  232 |     
  233 |     // Open modal
  234 |     const addShiftBtn = page.locator('button.add-shift-btn').first();
  235 |     await addShiftBtn.click();
  236 |     await captureStep(page, '01_modal_opened');
  237 |     
  238 |     // Check for start time input
  239 |     const startTimeInput = page.locator('input[type="datetime-local"]').first();
  240 |     await expect(startTimeInput).toBeVisible();
  241 |     
  242 |     // Check for label
  243 |     const startTimeLabel = page.locator('label:has-text("Start Time")');
  244 |     await expect(startTimeLabel).toBeVisible();
  245 |     await captureStep(page, '02_start_time_visible');
  246 |   });
  247 | 
  248 |   test('modal shows end time input', async ({ page }) => {
  249 |     await setupDemoAndNavigateToRoster(page);
  250 |     await captureStep(page, '00_roster_loaded');
  251 |     
  252 |     // Wait for roster data to load
  253 |     await page.waitForTimeout(2000);
  254 |     
  255 |     // Open modal
  256 |     const addShiftBtn = page.locator('button.add-shift-btn').first();
  257 |     await addShiftBtn.click();
  258 |     await captureStep(page, '01_modal_opened');
  259 |     
  260 |     // Check for end time input (second datetime-local input)
  261 |     const endTimeInputs = page.locator('input[type="datetime-local"]');
  262 |     await expect(endTimeInputs).toHaveCount(2);
  263 |     
  264 |     // Check for label
  265 |     const endTimeLabel = page.locator('label:has-text("End Time")');
  266 |     await expect(endTimeLabel).toBeVisible();
  267 |     await captureStep(page, '02_end_time_visible');
  268 |   });
  269 | 
  270 |   test('modal shows role label field', async ({ page }) => {
  271 |     await setupDemoAndNavigateToRoster(page);
  272 |     await captureStep(page, '00_roster_loaded');
  273 |     
  274 |     // Wait for roster data to load
  275 |     await page.waitForTimeout(2000);
  276 |     
  277 |     // Open modal
  278 |     const addShiftBtn = page.locator('button.add-shift-btn').first();
  279 |     await addShiftBtn.click();
  280 |     await captureStep(page, '01_modal_opened');
  281 |     
  282 |     // Check for role label input
  283 |     const roleLabelInput = page.locator('input[type="text"]');
  284 |     await expect(roleLabelInput).toBeVisible();
  285 |     
  286 |     // Check for label
  287 |     const roleLabel = page.locator('label:has-text("Role Label")');
  288 |     await expect(roleLabel).toBeVisible();
  289 |     await captureStep(page, '02_role_label_visible');
  290 |   });
  291 | 
  292 |   test('modal shows notes field', async ({ page }) => {
  293 |     await setupDemoAndNavigateToRoster(page);
  294 |     await captureStep(page, '00_roster_loaded');
  295 |     
  296 |     // Wait for roster data to load
  297 |     await page.waitForTimeout(2000);
  298 |     
  299 |     // Open modal
  300 |     const addShiftBtn = page.locator('button.add-shift-btn').first();
  301 |     await addShiftBtn.click();
  302 |     await captureStep(page, '01_modal_opened');
  303 |     
  304 |     // Check for notes textarea
  305 |     const notesTextarea = page.locator('textarea');
  306 |     await expect(notesTextarea).toBeVisible();
  307 |     
  308 |     // Check for label
  309 |     const notesLabel = page.locator('label:has-text("Notes")');
  310 |     await expect(notesLabel).toBeVisible();
  311 |     await captureStep(page, '02_notes_visible');
  312 |   });
  313 | });
  314 | 
  315 | test.describe('Shift Creation Modal - Actions', () => {
  316 |   test('modal has cancel button', async ({ page }) => {
  317 |     await setupDemoAndNavigateToRoster(page);
  318 |     await captureStep(page, '00_roster_loaded');
  319 |     
  320 |     // Wait for roster data to load
> 321 |     await page.waitForTimeout(2000);
      |                ^ Error: page.waitForTimeout: Target page, context or browser has been closed
  322 |     
  323 |     // Open modal
  324 |     const addShiftBtn = page.locator('button.add-shift-btn').first();
  325 |     await addShiftBtn.click();
  326 |     await captureStep(page, '01_modal_opened');
  327 |     
  328 |     // Check for cancel button
  329 |     const cancelBtn = page.locator('button:has-text("Cancel")');
  330 |     await expect(cancelBtn).toBeVisible();
  331 |     await captureStep(page, '02_cancel_button_visible');
  332 |   });
  333 | 
  334 |   test('modal has save shift button', async ({ page }) => {
  335 |     await setupDemoAndNavigateToRoster(page);
  336 |     await captureStep(page, '00_roster_loaded');
  337 |     
  338 |     // Wait for roster data to load
  339 |     await page.waitForTimeout(2000);
  340 |     
  341 |     // Open modal
  342 |     const addShiftBtn = page.locator('button.add-shift-btn').first();
  343 |     await addShiftBtn.click();
  344 |     await captureStep(page, '01_modal_opened');
  345 |     
  346 |     // Check for save button
  347 |     const saveBtn = page.locator('button:has-text("Save Shift")');
  348 |     await expect(saveBtn).toBeVisible();
  349 |     await captureStep(page, '02_save_button_visible');
  350 |   });
  351 | 
  352 |   test('cancel button closes modal without saving', async ({ page }) => {
  353 |     await setupDemoAndNavigateToRoster(page);
  354 |     await captureStep(page, '00_roster_loaded');
  355 |     
  356 |     // Wait for roster data to load
  357 |     await page.waitForTimeout(2000);
  358 |     
  359 |     // Open modal
  360 |     const addShiftBtn = page.locator('button.add-shift-btn').first();
  361 |     await addShiftBtn.click();
  362 |     await captureStep(page, '01_modal_opened');
  363 |     
  364 |     // Verify modal is visible
  365 |     const modal = page.locator('div.fixed.inset-0.z-50');
  366 |     await expect(modal).toBeVisible();
  367 |     
  368 |     // Click cancel
  369 |     const cancelBtn = page.locator('button:has-text("Cancel")');
  370 |     await cancelBtn.click();
  371 |     await captureStep(page, '02_cancel_clicked');
  372 |     
  373 |     // Modal should be closed
  374 |     await expect(modal).not.toBeVisible();
  375 |     await captureStep(page, '03_modal_closed');
  376 |   });
  377 | 
  378 |   test('modal title shows Add Shift', async ({ page }) => {
  379 |     await setupDemoAndNavigateToRoster(page);
  380 |     await captureStep(page, '00_roster_loaded');
  381 |     
  382 |     // Wait for roster data to load
  383 |     await page.waitForTimeout(2000);
  384 |     
  385 |     // Open modal
  386 |     const addShiftBtn = page.locator('button.add-shift-btn').first();
  387 |     await addShiftBtn.click();
  388 |     await captureStep(page, '01_modal_opened');
  389 |     
  390 |     // Check modal title
  391 |     const modalTitle = page.locator('h2:has-text("Add Shift")');
  392 |     await expect(modalTitle).toBeVisible();
  393 |     await captureStep(page, '02_modal_title_visible');
  394 |   });
  395 | });
  396 | 
  397 | test.describe('Roster Grid - Status Indicators', () => {
  398 |   test('roster shows status indicator', async ({ page }) => {
  399 |     await setupDemoAndNavigateToRoster(page);
  400 |     await captureStep(page, '00_roster_loaded');
  401 |     
  402 |     // Wait for roster data to load
  403 |     await page.waitForTimeout(2000);
  404 |     
  405 |     // Status should be visible at bottom
  406 |     const statusText = page.locator('text=Status:');
  407 |     await expect(statusText).toBeVisible({ timeout: 10000 });
  408 |     await captureStep(page, '01_status_visible');
  409 |   });
  410 | 
  411 |   test('roster shows loading state initially', async ({ page }) => {
  412 |     await page.goto('/demo');
  413 |     await page.waitForLoadState('networkidle');
  414 |     
  415 |     const setupBtn = page.locator('button:has-text("Set Up Demo Organization")');
  416 |     await setupBtn.click();
  417 |     
  418 |     const readyText = page.locator('text=Demo Ready!');
  419 |     await expect(readyText.or(page.locator('text=Failed to set up demo'))).toBeVisible({ timeout: 30000 });
  420 |     
  421 |     const ownerBtn = page.locator('button:has-text("Owner (Maria)")');
```