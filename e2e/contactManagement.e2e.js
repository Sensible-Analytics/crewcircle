describe("Contact Management E2E Tests", () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should add a new contact, edit it, and then delete it", async () => {
    await expect(element(by.id("camera-view"))).toBeVisible();
    await element(by.id("capture-button")).tap();

    await expect(element(by.id("results-view"))).toBeVisible();
    await expect(element(by.id("extracted-text"))).toHaveText(/John Doe/i);

    await expect(element(by.id("save-contact-button"))).toBeVisible();
    await element(by.id("save-contact-button")).tap();

    await expect(element(by.id("camera-view"))).toBeVisible();

    await element(by.id("contacts-tab-button")).tap();
    await expect(element(by.id("contacts-screen"))).toBeVisible();

    await expect(element(by.id("contact-item-John Doe"))).toBeVisible();

    await element(by.id("contact-item-John Doe")).tap();
    await expect(element(by.id("edit-contact-screen"))).toBeVisible();

    await element(by.id("name-input")).clearText();
    await element(by.id("name-input")).typeText("Jane Smith");

    await element(by.id("save-button")).tap();

    await expect(element(by.id("contacts-screen"))).toBeVisible();
    await expect(element(by.id("contact-item-Jane Smith"))).toBeVisible();
    await expect(element(by.id("contact-item-John Doe"))).not.toBeVisible();

    await element(by.id("contact-item-Jane Smith")).tap();
    await element(by.id("delete-button")).tap();
    await expect(element(by.id("contacts-screen"))).toBeVisible();
    await expect(element(by.id("contact-item-Jane Smith"))).not.toBeVisible();
  });
});
