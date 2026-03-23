import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import MlkitOcr, { DetectorType } from "rn-mlkit-ocr";
import {
  Camera,
  CameraPermissionStatus,
  useCameraDevice,
} from "react-native-vision-camera";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { Contact, createContact, hasContactDetails } from "../types/contact";
import { DEFAULT_APP_SETTINGS } from "../types/settings";
import { showErrorAlert } from "../utils/errorHandler";
import { exportContactAsVCard } from "../utils/exportUtils";
import { parseContactInfo } from "../utils/contactParser";
import storageUtils from "../utils/storage";

const OCR_LANGUAGE_LABELS: Record<string, string> = {
  chi_sim: "Chinese",
  deu: "German",
  eng: "English",
  fra: "French",
  ita: "Italian",
  jap: "Japanese",
  kor: "Korean",
  por: "Portuguese",
  rus: "Russian",
  spa: "Spanish",
};

const resolveDetectorType = (languages: string[]): DetectorType => {
  if (languages.includes("chi_sim")) {
    return "chinese";
  }

  if (languages.includes("jap")) {
    return "japanese";
  }

  if (languages.includes("kor")) {
    return "korean";
  }

  return "latin";
};

const formatLanguageSummary = (languages: string[]): string => {
  if (languages.length === 0) {
    return "English";
  }

  return languages
    .map((language) => OCR_LANGUAGE_LABELS[language] ?? language)
    .join(", ");
};

const ScannerScreen = () => {
  const cameraRef = useRef<Camera>(null);
  const device = useCameraDevice("back");
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState("");
  const [currentContact, setCurrentContact] = useState<Contact | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isCurrentContactSaved, setIsCurrentContactSaved] = useState(false);
  const [permissionStatus, setPermissionStatus] =
    useState<CameraPermissionStatus>("not-determined");
  const [ocrLanguages, setOcrLanguages] = useState(
    DEFAULT_APP_SETTINGS.ocrLanguages
  );
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(
    DEFAULT_APP_SETTINGS.autoSave
  );

  const resetScanState = useCallback(() => {
    setShowResults(false);
    setExtractedText("");
    setCurrentContact(null);
    setCapturedImage(null);
    setIsCurrentContactSaved(false);
  }, []);

  const loadScannerSettings = useCallback(async () => {
    try {
      const [savedLanguages, autoSave] = await Promise.all([
        storageUtils.getOcrLanguages(),
        storageUtils.getAutoSaveEnabled(),
      ]);

      setOcrLanguages(savedLanguages);
      setAutoSaveEnabled(autoSave);
    } catch (error) {
      console.warn("Failed to load scanner settings:", error);
    }
  }, []);

  const requestCameraPermission = useCallback(async () => {
    try {
      const status = await Camera.requestCameraPermission();
      setPermissionStatus(status);
      return status === "granted";
    } catch (error) {
      console.warn("Camera permission error:", error);
      setPermissionStatus("denied");
      return false;
    }
  }, []);

  const persistContact = useCallback(
    async (contact: Contact, successMessage: string) => {
      await storageUtils.addContact(contact);
      setIsCurrentContactSaved(true);
      Alert.alert("Success", successMessage);
    },
    []
  );

  useEffect(() => {
    requestCameraPermission();
  }, [requestCameraPermission]);

  useFocusEffect(
    useCallback(() => {
      loadScannerSettings();
    }, [loadScannerSettings])
  );

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || !device) {
      return;
    }

    try {
      setIsProcessing(true);

      const photo = await cameraRef.current.takePhoto({
        enableShutterSound: false,
      });
      const imageUri = photo.path.startsWith("file://")
        ? photo.path
        : `file://${photo.path}`;
      const detectorType = resolveDetectorType(ocrLanguages);
      const result = await MlkitOcr.recognizeText(imageUri, detectorType);
      const parsedInfo = parseContactInfo(result.text);
      const nextContact = createContact(parsedInfo);

      setCapturedImage(imageUri);
      setExtractedText(result.text);
      setCurrentContact(nextContact);
      setShowResults(true);
      setIsCurrentContactSaved(false);

      if (autoSaveEnabled && hasContactDetails(nextContact)) {
        await persistContact(nextContact, "Contact auto-saved successfully!");
      }
    } catch (error) {
      console.warn("Capture/OCR Error:", error);
      showErrorAlert(error, "OCR processing");
    } finally {
      setIsProcessing(false);
    }
  }, [autoSaveEnabled, device, ocrLanguages, persistContact]);

  const handleSaveContact = useCallback(async () => {
    if (!currentContact || !hasContactDetails(currentContact)) {
      Alert.alert("Error", "No contact information to save.");
      return;
    }

    if (isCurrentContactSaved) {
      Alert.alert("Info", "This contact is already saved.");
      return;
    }

    try {
      await persistContact(currentContact, "Contact saved successfully!");
    } catch (error) {
      console.warn("Save error:", error);
      showErrorAlert(error, "Save contact");
    }
  }, [currentContact, isCurrentContactSaved, persistContact]);

  const handleExportContact = useCallback(async () => {
    if (!currentContact || !hasContactDetails(currentContact)) {
      Alert.alert("Error", "No contact information to export.");
      return;
    }

    try {
      await exportContactAsVCard(currentContact);
      Alert.alert("Success", "Contact exported as VCard!");
    } catch (error) {
      console.warn("Export error:", error);
      showErrorAlert(error, "Export contact");
    }
  }, [currentContact]);

  if (permissionStatus === "not-determined") {
    return (
      <View style={Styles.container}>
        <Text style={Styles.permissionText}>
          Requesting camera permission...
        </Text>
      </View>
    );
  }

  if (permissionStatus === "denied" || permissionStatus === "restricted") {
    return (
      <View style={Styles.container}>
        <Text style={Styles.permissionText}>
          Camera permission is required to scan business cards.
        </Text>
        <TouchableOpacity
          style={Styles.button}
          onPress={requestCameraPermission}
          testID="grant-permission-button"
        >
          <Text style={Styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={Styles.container}>
        <Text style={Styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  return (
    <View style={Styles.container} testID="main-view">
      {!showResults ? (
        <View style={Styles.cameraContainer} testID="camera-view">
          <Camera
            ref={cameraRef}
            style={StyleSheet.absoluteFillObject}
            device={device}
            isActive={true}
            photo={true}
          />
          <View style={Styles.overlay}>
            <MaterialCommunityIcons name="scan-helper" size={40} color="#fff" />
            <Text style={Styles.instructionText}>
              Point camera at business card and tap to capture
            </Text>
            <Text style={Styles.subInstructionText}>
              OCR profile: {formatLanguageSummary(ocrLanguages)}
            </Text>
            <Text style={Styles.subInstructionText}>
              Auto-save: {autoSaveEnabled ? "On" : "Off"}
            </Text>
          </View>
          <TouchableOpacity
            style={Styles.captureButton}
            onPress={handleCapture}
            disabled={isProcessing}
            testID="capture-button"
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <MaterialCommunityIcons name="camera" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      ) : (
        <View style={Styles.resultsContainer} testID="results-view">
          {capturedImage ? (
            <Image
              source={{ uri: capturedImage }}
              style={Styles.capturedImage}
            />
          ) : null}

          <Text style={Styles.resultsTitle}>Extracted Information</Text>
          <Text style={Styles.resultsText} testID="extracted-text">
            {extractedText}
          </Text>

          {isCurrentContactSaved ? (
            <Text style={Styles.savedBanner}>Saved to contacts</Text>
          ) : null}

          <View style={Styles.contactInfoContainer}>
            <Text style={Styles.contactInfoLabel}>Name:</Text>
            <Text style={Styles.contactInfoValue}>
              {currentContact?.name || "Not detected"}
            </Text>

            <Text style={Styles.contactInfoLabel}>Email:</Text>
            <Text style={Styles.contactInfoValue}>
              {currentContact?.email || "Not detected"}
            </Text>

            <Text style={Styles.contactInfoLabel}>Phone:</Text>
            <Text style={Styles.contactInfoValue}>
              {currentContact?.phone || "Not detected"}
            </Text>

            <Text style={Styles.contactInfoLabel}>Company:</Text>
            <Text style={Styles.contactInfoValue}>
              {currentContact?.company || "Not detected"}
            </Text>

            <Text style={Styles.contactInfoLabel}>Website:</Text>
            <Text style={Styles.contactInfoValue}>
              {currentContact?.website || "Not detected"}
            </Text>
          </View>

          <View style={Styles.buttonContainer}>
            <TouchableOpacity
              style={Styles.button}
              onPress={resetScanState}
              testID="retake-button"
            >
              <MaterialCommunityIcons name="repeat" size={20} color="#fff" />
              <Text style={Styles.buttonText}>Retake</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                Styles.button,
                isCurrentContactSaved ? Styles.buttonDisabled : undefined,
              ]}
              onPress={handleSaveContact}
              disabled={isCurrentContactSaved}
              testID="save-contact-button"
            >
              <MaterialCommunityIcons
                name={isCurrentContactSaved ? "check" : "content-save"}
                size={20}
                color="#fff"
              />
              <Text style={Styles.buttonText}>
                {isCurrentContactSaved ? "Saved" : "Save Contact"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={Styles.button}
              onPress={handleExportContact}
              testID="export-contact-button"
            >
              <MaterialCommunityIcons
                name="share-variant"
                size={20}
                color="#fff"
              />
              <Text style={Styles.buttonText}>Export</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const Styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  cameraContainer: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    bottom: 112,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  instructionText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 8,
    textAlign: "center",
  },
  subInstructionText: {
    color: "#d9e7ff",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
  captureButton: {
    position: "absolute",
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0066cc",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  permissionText: {
    textAlign: "center",
    marginTop: 40,
    color: "#fff",
    fontSize: 18,
    paddingHorizontal: 20,
  },
  button: {
    marginVertical: 20,
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#0066cc",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 100,
  },
  buttonDisabled: {
    backgroundColor: "#5f8cbf",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  capturedImage: {
    width: "100%",
    height: 300,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  resultsText: {
    fontSize: 14,
    color: "#666",
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  savedBanner: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1b6f3a",
    marginBottom: 16,
  },
  contactInfoContainer: {
    marginBottom: 20,
  },
  contactInfoLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  contactInfoValue: {
    fontSize: 16,
    color: "#666",
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    flexWrap: "wrap",
    gap: 12,
  },
});

export default ScannerScreen;
