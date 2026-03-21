import RNFS from "react-native-fs";
import Share from "react-native-share";

export const exportContactAsVCard = async (contact: any) => {
  try {
    const vCard = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${contact.name || ""};;;;`,
      `FN:${contact.name || ""}`,
      contact.email ? `EMAIL:${contact.email}` : "",
      contact.phone ? `TEL:${contact.phone}` : "",
      contact.company ? `ORG:${contact.company}` : "",
      contact.address ? `ADR:${contact.address}` : "",
      contact.website ? `URL:${contact.website}` : "",
      "END:VCARD",
    ]
      .filter((line) => line !== "")
      .join("\n");

    const fileName = `${contact.name || "contact"}.vcf`.replace(/\s/g, "_");
    const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

    await RNFS.writeFile(filePath, vCard, "utf8");

    await Share.open({
      url: `file://${filePath}`,
      type: "text/vcard",
      title: "Share contact",
    });

    return true;
  } catch (error) {
    console.warn("Failed to export contact:", error);
    return false;
  }
};

export const exportContactsAsCSV = async (contacts: any[]) => {
  try {
    const header = [
      "Name",
      "Email",
      "Phone",
      "Company",
      "Address",
      "Website",
      "Scanned At",
    ];
    const rows = contacts.map((contact) => [
      contact.name || "",
      contact.email || "",
      contact.phone || "",
      contact.company || "",
      contact.address || "",
      contact.website || "",
      contact.scannedAt || "",
    ]);

    const csvContent = [
      header.join(","),
      ...rows.map((row) =>
        row
          .map((field) => {
            const escaped = ("" + field).replace(/"/g, '""');
            return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
          })
          .join(",")
      ),
    ].join("\n");

    const fileName = "contacts.csv";
    const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;

    await RNFS.writeFile(filePath, csvContent, "utf8");

    await Share.open({
      url: `file://${filePath}`,
      type: "text/csv",
      title: "Share contacts",
    });

    return true;
  } catch (error) {
    console.warn("Failed to export contacts:", error);
    return false;
  }
};
