import RNFS from "react-native-fs";
import Share from "react-native-share";
import {
  exportContactAsVCard,
  exportContactsAsCSV,
} from "../src/utils/exportUtils";
import { createContact, normalizeContactDraft } from "../src/types/contact";

jest.mock("react-native-fs", () => ({
  DocumentDirectoryPath: "/test/path",
  writeFile: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("react-native-share", () => ({
  open: jest.fn().mockResolvedValue(true),
}));

describe("exportUtils", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("exportContactAsVCard", () => {
    it("exports a contact with all fields as a VCard", async () => {
      const contact = normalizeContactDraft({
        name: "John Doe",
        email: "john@example.com",
        phone: "123-456-7890",
        company: "Acme Inc",
        address: "123 Main St",
        website: "https://example.com",
      });

      await exportContactAsVCard(contact);

      expect(RNFS.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("John_Doe.vcf"),
        expect.stringContaining("BEGIN:VCARD"),
        "utf8"
      );
      expect(Share.open).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining(".vcf"),
          type: "text/vcard",
          title: "Share contact",
        })
      );
    });

    it("throws when the VCard write fails", async () => {
      jest
        .mocked(RNFS.writeFile)
        .mockRejectedValueOnce(new Error("Write failed"));

      await expect(
        exportContactAsVCard(
          normalizeContactDraft({
            name: "Jane Doe",
          })
        )
      ).rejects.toThrow("Write failed");

      expect(Share.open).not.toHaveBeenCalled();
    });
  });

  describe("exportContactsAsCSV", () => {
    it("exports multiple contacts as CSV", async () => {
      const contacts = [
        createContact({
          name: "John Doe",
          email: "john@example.com",
          phone: "123-456-7890",
          company: "Acme Inc",
          address: "123 Main St",
          website: "https://example.com",
        }),
        createContact({
          name: "Jane Smith",
          email: "jane@example.com",
          phone: "098-765-4321",
        }),
      ];

      await exportContactsAsCSV(contacts);

      expect(RNFS.writeFile).toHaveBeenCalledWith(
        expect.stringContaining("contacts.csv"),
        expect.stringContaining(
          "Name,Email,Phone,Company,Address,Website,Scanned At"
        ),
        "utf8"
      );
      expect(Share.open).toHaveBeenCalledWith(
        expect.objectContaining({
          url: expect.stringContaining(".csv"),
          type: "text/csv",
          title: "Share contacts",
        })
      );
    });

    it("throws when the CSV write fails", async () => {
      jest
        .mocked(RNFS.writeFile)
        .mockRejectedValueOnce(new Error("Write failed"));

      await expect(exportContactsAsCSV([])).rejects.toThrow("Write failed");

      expect(Share.open).not.toHaveBeenCalled();
    });
  });
});
