describe("Contact Management E2E Tests", () => {
  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it("should add a new contact from a business card, edit it, and then delete it", async () => {
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

  it("should handle updating contact information from a rescanned business card", async () => {
    await expect(element(by.id("camera-view"))).toBeVisible();
    await element(by.id("capture-button")).tap();

    await expect(element(by.id("results-view"))).toBeVisible();
    await expect(element(by.id("extracted-text"))).toHaveText(/John Doe/i);
    await expect(element(by.id("extracted-text"))).toMatch(
      /john@oldcompany\.com/i
    );

    await expect(element(by.id("save-contact-button"))).toBeVisible();
    await element(by.id("save-contact-button")).tap();

    await expect(element(by.id("camera-view"))).toBeVisible();

    await element(by.id("contacts-tab-button")).tap();
    await expect(element(by.id("contacts-screen"))).toBeVisible();

    await expect(element(by.id("contact-item-John Doe"))).toBeVisible();
    await element(by.id("contact-item-John Doe")).tap();
    await expect(element(by.id("edit-contact-screen"))).toBeVisible();

    await element(by.id("company-input")).clearText();
    await element(by.id("company-input")).typeText("New Company Inc.");
    await element(by.id("email-input")).clearText();
    await element(by.id("email-input")).typeText("john@newcompany.com");

    await element(by.id("save-button")).tap();

    await expect(element(by.id("contacts-screen"))).toBeVisible();
    await expect(element(by.id("contact-item-John Doe"))).toBeVisible();

    await element(by.id("contacts-tab-button")).tap();
    await expect(element(by.id("camera-view"))).toBeVisible();
    await element(by.id("capture-button")).tap();

    await expect(element(by.id("results-view"))).toBeVisible();
    await expect(element(by.id("extracted-text"))).toHaveText(/John Doe/i);
    await expect(element(by.id("extracted-text"))).toMatch(
      /john@newcompany\.com/i
    );
    await expect(element(by.id("extracted-text"))).toMatch(
      /New Company Inc\./i
    );

    await expect(element(by.id("save-contact-button"))).toBeVisible();
    await element(by.id("save-contact-button")).tap();

    await expect(element(by.id("camera-view"))).toBeVisible();

    await element(by.id("contacts-tab-button")).tap();
    await expect(element(by.id("contacts-screen"))).toBeVisible();

    await expect(element(by.id("contact-item-John Doe"))).toBeVisible();
  });
});
