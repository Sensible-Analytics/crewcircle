import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Alert,
} from "react-native";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";

const SettingsScreen = () => {
  const [ocrLanguages, setOcrLanguages] = useState<string[]>(["eng"]);
  const [availableLanguages] = useState<string[]>([
    "eng",
    "spa",
    "fra",
    "deu",
    "ita",
    "por",
    "rus",
    "jap",
    "kor",
    "chi_sim",
  ]);
  const [languageNames] = useState<Record<string, string>>({
    eng: "English",
    spa: "Spanish",
    fra: "French",
    deu: "German",
    ita: "Italian",
    por: "Portuguese",
    rus: "Russian",
    jap: "Japanese",
    kor: "Korean",
    chi_sim: "Chinese (Simplified)",
  });
  const [autoSave, setAutoSave] = useState(true);
  const [notificationEnabled, setNotificationEnabled] = useState(true);
  const [dataUsage, setDataUsage] = useState<"wifi-only" | "cellular">(
    "wifi-only"
  );

  const toggleLanguage = (language: string) => {
    setOcrLanguages((prev) => {
      if (prev.includes(language)) {
        return prev.filter((lang) => lang !== language);
      } else {
        return [...prev, language];
      }
    });
  };

  const handleExportData = () => {
    Alert.alert(
      "Export Data",
      "This feature will allow you to export your contacts and settings. Coming soon!",
      [{ text: "OK", style: "cancel" }]
    );
  };

  const handleImportData = () => {
    Alert.alert(
      "Import Data",
      "This feature will allow you to import your contacts and settings. Coming soon!",
      [{ text: "OK", style: "cancel" }]
    );
  };

  const handleResetApp = () => {
    Alert.alert(
      "Reset App",
      "Are you sure you want to reset all data and settings? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            // TODO: Implement reset functionality
            Alert.alert("Success", "App has been reset to default settings.");
          },
        },
      ]
    );
  };

  return (
    <View style={Styles.container} testID="settings-screen">
      <View style={Styles.header} testID="header">
        <Text style={Styles.headerTitle} testID="header-title">
          Settings
        </Text>
      </View>

      <View style={Styles.section} testID="ocr-settings-section">
        <Text style={Styles.sectionTitle} testID="section-title">
          OCR Settings
        </Text>
        {availableLanguages.map((lang) => (
          <View
            key={lang}
            style={Styles.languageRow}
            testID={`language-row-${lang}`}
          >
            <TouchableOpacity
              style={[
                Styles.languageButton,
                ocrLanguages.includes(lang) ? Styles.selectedLanguage : {},
              ]}
              onPress={() => toggleLanguage(lang)}
              testID={`language-toggle-${lang}`}
            >
              <Text
                style={Styles.languageText}
                testID={`language-text-${lang}`}
              >
                {languageNames[lang] || lang}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={Styles.section} testID="general-settings-section">
        <Text style={Styles.sectionTitle} testID="section-title">
          General Settings
        </Text>
        <View style={Styles.settingRow} testID="auto-save-row">
          <Text style={Styles.settingLabel} testID="setting-label">
            Auto-save Contacts
          </Text>
          <Switch
            value={autoSave}
            onValueChange={setAutoSave}
            thumbColor={autoSave ? "#f5dd4b" : "#f4f3f4"}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            testID="auto-save-switch"
          />
        </View>
        <View style={Styles.settingRow} testID="notifications-row">
          <Text style={Styles.settingLabel} testID="setting-label">
            Notifications
          </Text>
          <Switch
            value={notificationEnabled}
            onValueChange={setNotificationEnabled}
            thumbColor={notificationEnabled ? "#f5dd4b" : "#f4f3f4"}
            trackColor={{ false: "#767577", true: "#81b0ff" }}
            testID="notifications-switch"
          />
        </View>
        <View style={Styles.settingRow} testID="data-usage-row">
          <Text style={Styles.settingLabel} testID="setting-label">
            Data Usage
          </Text>
          <View style={Styles.dataUsageOptions} testID="data-usage-options">
            <TouchableOpacity
              style={[
                Styles.dataUsageOption,
                dataUsage === "wifi-only" ? Styles.selectedDataUsage : {},
              ]}
              onPress={() => setDataUsage("wifi-only")}
              testID="wifi-only-option"
            >
              <Text style={Styles.dataUsageText} testID="data-usage-text">
                Wi-Fi Only
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                Styles.dataUsageOption,
                dataUsage === "cellular" ? Styles.selectedDataUsage : {},
              ]}
              onPress={() => setDataUsage("cellular")}
              testID="cellular-option"
            >
              <Text style={Styles.dataUsageText} testID="data-usage-text">
                Cellular
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={Styles.section} testID="data-management-section">
        <Text style={Styles.sectionTitle} testID="section-title">
          Data Management
        </Text>
        <TouchableOpacity
          style={Styles.button}
          onPress={handleExportData}
          testID="export-data-button"
        >
          <MaterialCommunityIcons
            name="content-save-all"
            size={20}
            color="#fff"
          />
          <Text style={Styles.buttonText} testID="button-text">
            Export Data
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={Styles.button}
          onPress={handleImportData}
          testID="import-data-button"
        >
          <MaterialCommunityIcons
            name="content-duplicate"
            size={20}
            color="#fff"
          />
          <Text style={Styles.buttonText} testID="button-text">
            Import Data
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={Styles.button}
          onPress={handleResetApp}
          testID="reset-app-button"
        >
          <MaterialCommunityIcons name="restart" size={20} color="#fff" />
          <Text style={Styles.buttonText} testID="button-text">
            Reset App
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default SettingsScreen;

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: 16,
    backgroundColor: "#0066cc",
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "600",
  },
  section: {
    padding: 16,
    marginBottom: 16,
    backgroundColor: "#fff",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  languageRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#f0f0f0",
  },
  languageButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  selectedLanguage: {
    backgroundColor: "#e3f2fd",
  },
  languageText: {
    fontSize: 16,
    color: "#333",
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  settingLabel: {
    fontSize: 16,
    color: "#333",
  },
  dataUsageOptions: {
    flexDirection: "row",
  },
  dataUsageOption: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    marginRight: 8,
  },
  selectedDataUsage: {
    backgroundColor: "#e3f2fd",
  },
  dataUsageText: {
    fontSize: 14,
    color: "#333",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginHorizontal: 16,
    backgroundColor: "#0066cc",
    borderRadius: 8,
    marginVertical: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
});
