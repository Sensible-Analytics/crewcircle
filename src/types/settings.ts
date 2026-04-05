export type DataUsagePreference = "wifi-only" | "cellular";

export type AppSettings = {
  ocrLanguages: string[];
  autoSave: boolean;
  notificationEnabled: boolean;
  dataUsage: DataUsagePreference;
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  ocrLanguages: ["eng"],
  autoSave: true,
  notificationEnabled: true,
  dataUsage: "wifi-only",
};
