import { ParsedContactInfo } from "../types/contact";

// Utility function to parse contact information from OCR extracted text
export const parseContactInfo = (text: string): ParsedContactInfo => {
  const info: ParsedContactInfo = {};

  // Simple regex patterns for common contact info
  const emailMatch = text.match(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
  );
  if (emailMatch) info.email = emailMatch[0];

  const phoneMatch = text.match(
    /(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/
  );
  if (phoneMatch) info.phone = phoneMatch[0];

  // Try to find company name (look for common suffixes)
  const companyMatch = text.match(
    /(?:Inc|LLC|Ltd|Corp|Corporation|Company|Co\.)/i
  );
  if (companyMatch) {
    // Extract a line containing the company match
    const lines = text.split("\n");
    const companyLine = lines.find((line) => line.includes(companyMatch[0]));
    if (companyLine) info.company = companyLine.trim();
  }

  // Assume the first line might be a name (if it's short and doesn't contain @ or numbers)
  const lines = text.split("\n").filter((line) => line.trim() !== "");
  if (lines.length > 0) {
    const firstLine = lines[0].trim();
    if (
      firstLine.length < 50 &&
      !firstLine.includes("@") &&
      !/\d{3}/.test(firstLine)
    ) {
      info.name = firstLine;
    }
  }

  // Look for website
  const websiteMatch = text.match(
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/
  );
  if (websiteMatch) info.website = websiteMatch[0];

  return info;
};

export type ContactInfo = {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  address?: string;
  website?: string;
};
