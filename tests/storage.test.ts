import AsyncStorage from "@react-native-async-storage/async-storage";
import storageUtils from "../src/utils/storage";
import { createContact } from "../src/types/contact";

type MockAsyncStorage = {
  getItem: jest.Mock<Promise<string | null>, [string]>;
  setItem: jest.Mock<Promise<void>, [string, string]>;
  multiRemove: jest.Mock<Promise<void>, [readonly string[]]>;
};

const asyncStorage = AsyncStorage as unknown as MockAsyncStorage;

const createMemoryStore = () => {
  const store = new Map<string, string>();

  asyncStorage.getItem.mockImplementation(async (key: string) => {
    return store.has(key) ? store.get(key)! : null;
  });

  asyncStorage.setItem.mockImplementation(
    async (key: string, value: string) => {
      store.set(key, value);
    }
  );

  asyncStorage.multiRemove.mockImplementation(
    async (keys: readonly string[]) => {
      keys.forEach((key) => store.delete(key));
    }
  );

  return store;
};

describe("storageUtils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    createMemoryStore();
  });

  test("adds and reads contacts", async () => {
    const contact = createContact({
      name: "John Doe",
      email: "john@example.com",
      phone: "123-456-7890",
      company: "Acme Inc",
      address: "123 Main St",
      website: "https://example.com",
    });

    await storageUtils.addContact(contact);

    const contacts = await storageUtils.getContacts();

    expect(contacts).toHaveLength(1);
    expect(contacts[0]).toMatchObject(contact);
  });

  test("migrates legacy contacts without ids and timestamps", async () => {
    await asyncStorage.setItem(
      "contacts",
      JSON.stringify([
        {
          name: "Legacy Contact",
          email: "legacy@example.com",
          phone: "",
          company: "",
          address: "",
          website: "",
        },
      ])
    );

    const contacts = await storageUtils.getContacts();

    expect(contacts).toHaveLength(1);
    expect(contacts[0].id).toMatch(/^contact-/);
    expect(contacts[0].scannedAt).toBeTruthy();
    expect(contacts[0].name).toBe("Legacy Contact");
  });

  test("deletes contacts by id", async () => {
    const contact = createContact({
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "098-765-4321",
      company: "XYZ Corp",
    });

    await storageUtils.addContact(contact);
    await storageUtils.deleteContact(contact.id);

    const contacts = await storageUtils.getContacts();

    expect(contacts).toEqual([]);
  });

  test("updates contacts while preserving identity", async () => {
    const contact = createContact({
      name: "John Doe",
      email: "john@example.com",
      phone: "123-456-7890",
      company: "Acme Inc",
    });

    await storageUtils.addContact(contact);

    await storageUtils.updateContact(contact.id, {
      ...contact,
      name: "Jane Doe",
      email: "jane@example.com",
      updatedAt: "2026-03-23T00:00:00.000Z",
    });

    const contacts = await storageUtils.getContacts();

    expect(contacts[0].id).toBe(contact.id);
    expect(contacts[0].scannedAt).toBe(contact.scannedAt);
    expect(contacts[0].name).toBe("Jane Doe");
    expect(contacts[0].email).toBe("jane@example.com");
    expect(contacts[0].updatedAt).toBe("2026-03-23T00:00:00.000Z");
  });

  test("persists and reads settings", async () => {
    await storageUtils.saveAutoSaveEnabled(false);
    await storageUtils.saveNotificationEnabled(false);
    await storageUtils.saveDataUsagePreference("cellular");
    await storageUtils.saveOcrLanguages(["eng", "jap"]);

    const settings = await storageUtils.getAppSettings();

    expect(settings).toEqual({
      autoSave: false,
      notificationEnabled: false,
      dataUsage: "cellular",
      ocrLanguages: ["eng", "jap"],
    });
  });

  test("resets contacts and settings", async () => {
    const contact = createContact({
      name: "Reset Me",
      email: "reset@example.com",
    });

    await storageUtils.addContact(contact);
    await storageUtils.saveAutoSaveEnabled(false);
    await storageUtils.resetAppData();

    await expect(storageUtils.getContacts()).resolves.toEqual([]);
    await expect(storageUtils.getAutoSaveEnabled()).resolves.toBe(true);
  });
});
