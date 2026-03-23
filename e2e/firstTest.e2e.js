/**
 * End-to-End Test for CardScannerApp
 * Comprehensive user flows covering real-world scenarios
 */

describe("CardScannerApp E2E Tests", () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should scan a standard business card, save the contact, and display it in the contacts list", async () => {
    // Grant camera permission (if needed)
    await expect(element(by.id("camera-view"))).toBeVisible();

    // Simulate capturing an image
    await expect(element(by.id("capture-button"))).toBeVisible();
    await element(by.id("capture-button")).tap();

    // Wait for OCR processing and results to appear
    await expect(element(by.id("results-view"))).toBeVisible();
    await expect(element(by.id("extracted-text"))).toHaveText(/John Doe/i);

    // Save the contact
    await expect(element(by.id("save-contact-button"))).toBeVisible();
    await element(by.id("save-contact-button")).tap();

    // Verify success alert and return to camera view
    await expect(element(by.id("camera-view"))).toBeVisible();

    // Navigate to contacts screen
    await element(by.id("contacts-tab-button")).tap();
    await expect(element(by.id("contacts-screen"))).toBeVisible();

    // Verify the saved contact appears in the list
    await expect(element(by.id("contact-item-John Doe"))).toBeVisible();
  });

  it("should handle business cards with glossy finish and reflective surfaces", async () => {
    // This test simulates scanning a card with glare/reflection issues
    await expect(element(by.id("camera-view"))).toBeVisible();

    // Simulate capturing an image with potential glare
    await expect(element(by.id("capture-button"))).toBeVisible();
    await element(by.id("capture-button")).tap();

    // Wait for OCR processing (might take longer due to glare compensation)
    await expect(element(by.id("results-view"))).toBeVisible();
    await expect(element(by.id("extracted-text"))).toHaveText(/Jane Smith/i);

    // Verify we can still extract key information despite glare
    await expect(element(by.id("extracted-text"))).toMatch(
      /jane\.smith@email\.com/i
    );
    await expect(element(by.id("extracted-text"))).toMatch(/\+1-555-987-6543/i);

    // Save the contact
    await expect(element(by.id("save-contact-button"))).toBeVisible();
    await element(by.id("save-contact-button")).tap();

    // Verify success
    await expect(element(by.id("camera-view"))).toBeVisible();
  });

  it("should handle business cards with handwritten notes on them", async () => {
    // This test simulates scanning a card with handwritten annotations
    await expect(element(by.id("camera-view"))).toBeVisible();

    // Simulate capturing an image
    await expect(element(by.id("capture-button"))).toBeVisible();
    await element(by.id("capture-button")).tap();

    // Wait for OCR processing
    await expect(element(by.id("results-view"))).toBeVisible();
    await expect(element(by.id("extracted-text"))).toHaveText(
      /Robert Johnson/i
    );

    // Verify key information is extracted despite handwritten notes
    await expect(element(by.id("extracted-text"))).toMatch(
      /robert\.johnson@company\.org/i
    );
    await expect(element(by.id("extracted-text"))).toMatch(/555-111-2222/i);

    // Save the contact
    await expect(element(by.id("save-contact-button"))).toBeVisible();
    await element(by.id("save-contact-button")).tap();

    // Verify success
    await expect(element(by.id("camera-view"))).toBeVisible();
  });
});
