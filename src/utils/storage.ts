import AsyncStorage from "@react-native-async-storage/async-storage";

export const storageUtils = {
  // Contacts
  getContacts: async (): Promise<any[]> => {
    try {
      const contactsJson = await AsyncStorage.getItem("contacts");
      return contactsJson ? JSON.parse(contactsJson) : [];
    } catch (error) {
      console.error("Failed to get contacts:", error);
      return [];
    }
  },

  saveContacts: async (contacts: any[]) => {
    try {
      await AsyncStorage.setItem("contacts", JSON.stringify(contacts));
    } catch (error) {
      console.error("Failed to save contacts:", error);
    }
  },

  addContact: async (contact: any) => {
    try {
      const contacts = await storageUtils.getContacts();
      contacts.push(contact);
      await storageUtils.saveContacts(contacts);
    } catch (error) {
      console.error("Failed to add contact:", error);
    }
  },

  updateContact: async (id: string, updatedContact: any) => {
    try {
      const contacts = await storageUtils.getContacts();
      const index = contacts.findIndex((c: any) => c.id === id);
      if (index !== -1) {
        contacts[index] = { ...contacts[index], ...updatedContact };
        await storageUtils.saveContacts(contacts);
      }
    } catch (error) {
      console.error("Failed to update contact:", error);
    }
  },

  deleteContact: async (id: string) => {
    try {
      const contacts = await storageUtils.getContacts();
      const filteredContacts = contacts.filter((c: any) => c.id !== id);
      await storageUtils.saveContacts(filteredContacts);
    } catch (error) {
      console.error("Failed to delete contact:", error);
    }
  },

  // Settings
  getSetting: async (key: string, defaultValue: any = null): Promise<any> => {
    try {
      const value = await AsyncStorage.getItem(key);
      return value !== null ? JSON.parse(value) : defaultValue;
    } catch (error) {
      console.error("Failed to get setting:", error);
      return defaultValue;
    }
  },

  saveSetting: async (key: string, value: any) => {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Failed to save setting:", error);
    }
  },

  // OCR Languages
  getOcrLanguages: async (): Promise<string[]> => {
    try {
      const languages = await AsyncStorage.getItem("ocrLanguages");
      return languages ? JSON.parse(languages) : ["eng"];
    } catch (error) {
      console.error("Failed to get OCR languages:", error);
      return ["eng"];
    }
  },

  saveOcrLanguages: async (languages: string[]) => {
    try {
      await AsyncStorage.setItem("ocrLanguages", JSON.stringify(languages));
    } catch (error) {
      console.error("Failed to save OCR languages:", error);
    }
  },
};

export default storageUtils;
