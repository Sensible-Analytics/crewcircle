export type ContactDraft = {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  website: string;
};

export type ParsedContactInfo = Partial<ContactDraft>;

export type Contact = ContactDraft & {
  id: string;
  scannedAt: string;
  updatedAt?: string;
};

const EMPTY_CONTACT_DRAFT: ContactDraft = {
  name: "",
  email: "",
  phone: "",
  company: "",
  address: "",
  website: "",
};

const toTrimmedString = (value: unknown): string => {
  return typeof value === "string" ? value.trim() : "";
};

export const normalizeContactDraft = (
  draft: Partial<ContactDraft> = {}
): ContactDraft => {
  return {
    name: toTrimmedString(draft.name),
    email: toTrimmedString(draft.email),
    phone: toTrimmedString(draft.phone),
    company: toTrimmedString(draft.company),
    address: toTrimmedString(draft.address),
    website: toTrimmedString(draft.website),
  };
};

export const hasContactDetails = (
  contact: Partial<ContactDraft> | null | undefined
): boolean => {
  if (!contact) {
    return false;
  }

  const normalized = normalizeContactDraft(contact);

  return Object.values(normalized).some((value) => value.length > 0);
};

export const generateContactId = (): string => {
  const randomSuffix = Math.random().toString(36).slice(2, 10);
  return `contact-${Date.now()}-${randomSuffix}`;
};

export const createContact = (
  draft: Partial<ContactDraft>,
  overrides: Partial<Pick<Contact, "id" | "scannedAt" | "updatedAt">> = {}
): Contact => {
  const normalizedDraft = normalizeContactDraft(draft);

  return {
    ...EMPTY_CONTACT_DRAFT,
    ...normalizedDraft,
    id: overrides.id ?? generateContactId(),
    scannedAt: overrides.scannedAt ?? new Date().toISOString(),
    ...(overrides.updatedAt ? { updatedAt: overrides.updatedAt } : {}),
  };
};
