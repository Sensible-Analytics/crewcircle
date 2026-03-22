/**
 * End-to-End Test for CardScannerApp
 * Core user flow: Scan business card -> Save contact -> View in list
 */

describe("CardScannerApp E2E Tests", () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should scan a business card, save the contact, and display it in the contacts list", async () => {
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
});
