# Card Scanner App

A simple and efficient business card scanner application built with React Native.

## Overview

This application allows users to scan business cards using their device's camera, extract text using OCR technology, parse contact information, and save or export the contacts in various formats.

## Features

- **Card Scanning**: Use your device camera to capture business cards
- **Text Extraction**: Utilizes OCR technology to extract text from scanned cards
- **Contact Parsing**: Automatically identifies and extracts contact details (name, email, phone, company, website)
- **Contact Storage**: Saves contacts locally on your device
- **Export Options**: Export contacts as VCard files for easy sharing
- **Contact Management**: View and manage your saved contacts within the app
- **Settings**: Configure OCR languages and other preferences

## Getting Started

### Prerequisites

- Node.js (version 14 or later)
- npm or yarn package manager
- Xcode (for iOS development)
- Android Studio (for Android development)
- CocoaPods (for iOS dependencies)

### Installation

1. Clone this repository to your local machine
2. Navigate to the project directory:
   ```bash
   cd CardScannerApp
   ```
3. Install the required JavaScript dependencies:
   ```bash
   npm install
   ```
4. For iOS development, install the required pods:
   ```bash
   cd ios && pod install && cd ..
   ```

### Running the Application

#### On iOS Simulator

```bash
npm run ios
```

#### On Android Emulator

```bash
npm run android
```

## How It Works

1. Launch the app and grant camera permissions when prompted
2. Point your device's camera at a business card
3. Tap the capture button to take a photo of the card
4. The app processes the image using OCR to extract text
5. Contact information is automatically parsed from the extracted text
6. Review the detected information and save or export the contact as needed

## Technology Stack

- **Framework**: React Native 0.74.0
- **Programming Language**: TypeScript
- **Camera Access**: react-native-vision-camera
- **OCR Processing**: rn-mlkit-ocr (Google ML Kit)
- **Local Storage**: @react-native-async-storage/async-storage
- **Navigation**: @react-navigation/native and related packages
- **File System**: react-native-fs
- **Sharing**: react-native-share
- **UI Components**: React Native core components and react-native-vector-icons

## Notes

- The application requires camera access to function
- Contact data is stored locally on your device and is not shared with any external services
- For optimal OCR results, ensure good lighting and a clear, well-focused image of the business card

## Testing Strategy

This application implements a comprehensive testing strategy to ensure quality and reliability:

### Unit Testing

- Jest is used for unit and integration testing
- Test coverage is enforced at >90% for all source files
- Tests cover:
  - Core components: ScannerScreen, ContactsScreen, EditContactScreen, SettingsScreen
  - Utility functions: exportUtils, errorHandler, storage, contactParser
  - Mocking of external dependencies (camera, OCR, storage, navigation)

### End-to-End Testing

- Detox is used for end-to-end testing on both iOS and Android
- Critical user flows tested:
  1. Scan business card → Save contact → View in contacts list
  2. Contact management: Add contact → Edit contact → Delete contact
  3. Settings persistence: Verify OCR languages, auto-save, notifications, and data usage settings persist across app restarts
- Test IDs have been added to all key UI elements for reliable test selection

### Continuous Integration

- GitHub Actions workflows run tests on every push and pull request
- Android and iOS builds are configured to:
  - Run linting with zero warnings tolerance
  - Execute all unit tests and enforce coverage thresholds
  - Build platform-specific artifacts (APK for Android, .app for iOS)
  - Fail builds on test failures or coverage violations

To run tests locally:

```bash
# Run unit tests
npm test

# Run tests in CI mode (single run)
npm run test:ci

# Run end-to-end tests on iOS simulator
npm run detox:test

# Run end-to-end tests on Android emulator
npm run detox:test:android
```
