import * as exportUtils from "../src/utils/exportUtils";

// Mock react-native-fs
jest.mock("react-native-fs", () => ({
  DocumentDirectoryPath: "/test/path",
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

// Mock react-native-share
jest.mock("react-native-share", () => ({
  open: jest.fn().mockResolvedValue(true),
}));

describe("exportUtils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("exportContactAsVCard", () => {
    it("should export a contact with all fields as VCard", async () => {
      const contact = {
        name: "John Doe",
        email: "john@example.com",
        phone: "123-456-7890",
        company: "Acme Inc",
        address: "123 Main St",
        website: "https://example.com",
      };

      const result = await exportUtils.exportContactAsVCard(contact);

      expect(result).toBe(true);

      // Verify RNFS.writeFile was called
      expect(require("react-native-fs").writeFile).toHaveBeenCalled();

      // Verify Share.open was called
      expect(require("react-native-share").open).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining(".vcf"),
          type: "text/vcard",
          title: "Share contact",
        })
      );
    });

    it("should export a contact with minimal fields as VCard", async () => {
      const contact = {
        name: "Jane Doe",
      };

      const result = await exportUtils.exportContactAsVCard(contact);

      expect(result).toBe(true);

      // Verify RNFS.writeFile was called
      expect(require("react-native-fs").writeFile).toHaveBeenCalled();

      // Verify Share.open was called
      expect(require("react-native-share").open).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining(".vcf"),
          type: "text/vcard",
          title: "Share contact",
        })
      );
    });

    it("should handle export failure gracefully", async () => {
      // Mock writeFile to reject
      require("react-native-fs").writeFile.mockRejectedValueOnce(
        new Error("Write failed")
      );

      const contact = {
        name: "John Doe",
        email: "john@example.com",
      };

      const result = await exportUtils.exportContactAsVCard(contact);

      expect(result).toBe(false);

      // Verify Share.open was NOT called
      expect(require("react-native-share").open).not.toHaveBeenCalled();
    });
  });

  describe("exportContactsAsCSV", () => {
    it("should export multiple contacts as CSV", async () => {
      const contacts = [
        {
          name: "John Doe",
          email: "john@example.com",
          phone: "123-456-7890",
          company: "Acme Inc",
          address: "123 Main St",
          website: "https://example.com",
          scannedAt: "2023-01-01T10:00:00Z",
        },
        {
          name: "Jane Smith",
          email: "jane@example.com",
          phone: "098-765-4321",
        },
      ];

      const result = await exportUtils.exportContactsAsCSV(contacts);

      expect(result).toBe(true);

      // Verify RNFS.writeFile was called
      expect(require("react-native-fs").writeFile).toHaveBeenCalled();

      // Verify Share.open was called
      expect(require("react-native-share").open).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining(".csv"),
          type: "text/csv",
          title: "Share contacts",
        })
      );
    });

    it("should handle empty contacts array", async () => {
      const contacts: any[] = [];

      const result = await exportUtils.exportContactsAsCSV(contacts);

      expect(result).toBe(true);

      // Verify RNFS.writeFile was called
      expect(require("react-native-fs").writeFile).toHaveBeenCalled();

      // Verify Share.open was called
      expect(require("react-native-share").open).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining(".csv"),
          type: "text/csv",
          title: "Share contacts",
        })
      );
    });

    it("should handle export failure gracefully", async () => {
      // Mock writeFile to reject
      require("react-native-fs").writeFile.mockRejectedValueOnce(
        new Error("Write failed")
      );

      const contacts = [
        {
          name: "John Doe",
          email: "john@example.com",
        },
      ];

      const result = await exportUtils.exportContactsAsCSV(contacts);

      expect(result).toBe(false);

      // Verify Share.open was NOT called
      expect(require("react-native-share").open).not.toHaveBeenCalled();
    });
  });
});
