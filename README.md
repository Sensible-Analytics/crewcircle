# CardScannerApp

[![CI](https://github.com/Sensible-Analytics/CardScannerApp/actions/workflows/ci.yml/badge.svg)](https://github.com/Sensible-Analytics/CardScannerApp/actions/workflows/ci.yml)
[![Android Build](https://github.com/Sensible-Analytics/CardScannerApp/actions/workflows/android-build.yml/badge.svg)](https://github.com/Sensible-Analytics/CardScannerApp/actions/workflows/android-build.yml)
[![iOS Build](https://github.com/Sensible-Analytics/CardScannerApp/actions/workflows/ios-build.yml/badge.svg)](https://github.com/Sensible-Analytics/CardScannerApp/actions/workflows/ios-build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Known Vulnerabilities](https://snyk.io/test/github/Sensible-Analytics/CardScannerApp/badge.svg)](https://snyk.io/test/github/Sensible-Analytics/CardScannerApp)

A professional business card scanner application built with React Native, featuring OCR-powered text extraction and intelligent contact parsing.

## 🚀 Features

- **📷 Card Scanning**: Capture business cards using your device camera
- **🔍 OCR Text Extraction**: Utilizes Google ML Kit for accurate text recognition
- **👥 Intelligent Contact Parsing**: Automatically extracts names, emails, phones, companies, and websites
- **💾 Local Storage**: Secure on-device storage with AsyncStorage
- **📤 Export Options**: Export contacts as VCard files for sharing
- **📱 Cross-Platform**: Available for both iOS and Android
- **🧪 Comprehensive Testing**: 90%+ test coverage with unit and E2E tests

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Running the App](#running-the-app)
- [Testing](#-testing)
- [CI/CD](#-cicd)
- [Release Process](#-release-process)
- [App Store Deployment](#-app-store-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Security](#-security)
- [Privacy](#-privacy)

## 🛠 Technology Stack

| Category | Technology | Purpose |
|----------|------------|---------|
| **Framework** | React Native 0.84.1 | Cross-platform mobile development |
| **Language** | TypeScript | Type-safe JavaScript development |
| **Camera** | react-native-vision-camera | High-performance camera access |
| **OCR** | rn-mlkit-ocr (Google ML Kit) | Text recognition from images |
| **Storage** | @react-native-async-storage/async-storage | Persistent local data storage |
| **Navigation** | @react-navigation/native | Screen navigation and routing |
| **File System** | react-native-fs | File operations for exports |
| **Sharing** | react-native-share | Native sharing capabilities |
| **UI Components** | react-native-vector-icons | Icon library for consistent UI |

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **npm** or **yarn** package manager
- **Xcode** (for iOS development)
- **Android Studio** (for Android development)
- **CocoaPods** (for iOS dependencies)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/cardScanner.git
   cd cardScanner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install iOS dependencies** (iOS only)
   ```bash
   cd ios && pod install && cd ..
   ```

### Running the App

#### iOS
```bash
npm run ios
```

#### Android
```bash
npm run android
```

## 🧪 Testing

We maintain comprehensive test coverage to ensure reliability and quality.

### Unit Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in CI mode
npm run test:ci
```

### End-to-End Testing

```bash
# iOS E2E tests
npm run detox:build:ios && npm run detox:test:ios

# Android E2E tests  
npm run detox:build:android && npm run detox:test:android

# Run all E2E tests
npm run e2e:all
```

### Test Coverage

- **Unit Tests**: 53+ test cases covering all utility functions and components
- **E2E Tests**: 12 test files with 65+ test scenarios
- **Coverage Threshold**: >90% for all source files

## 🔄 CI/CD

Our CI/CD pipeline ensures code quality and automated testing:

### Workflows

1. **CI Workflow** (`ci.yml`)
   - Runs on every push and pull request
   - Linting and TypeScript checks
   - Unit tests with coverage enforcement
   - E2E tests for both platforms

2. **Android Build** (`android-build.yml`)
   - Builds Android APK
   - Uploads build artifacts

3. **iOS Build** (`ios-build.yml`)
   - Builds iOS app
   - Uploads build artifacts

### Running CI Locally

```bash
# Run linting
npm run lint

# Run TypeScript check
npx tsc --noEmit

# Run tests
npm run test:ci
```

## 📦 Release Process

### Generating Release Artifacts

```bash
# Build iOS release IPA (requires Xcode)
npm run release:ios

# Build Android release APK
npm run release:android

# Verify generated artifacts
npm run release:verify
```

### Release Workflow

1. **Code Review**: All changes must pass CI and receive approval
2. **Version Bump**: Update version in `package.json` and `app.json`
3. **Changelog**: Document changes in release notes
4. **Build Artifacts**: Generate platform-specific artifacts
5. **GitHub Release**: Create tagged release with artifacts
6. **Store Submission**: Submit to App Store and Google Play

## 📱 App Store Deployment

### iOS App Store (App Store Connect)

#### Prerequisites
- Apple Developer Account ($99/year)
- Xcode with latest SDK
- App Store Connect access

#### Steps
1. **Generate Release IPA**
   ```bash
   npm run release:ios
   ```

2. **Upload to App Store Connect**
   - Use Xcode Organizer or `xcrun altool`
   - Verify build in App Store Connect

3. **App Store Listing**
   - App name: CardScanner
   - Subtitle: Business Card Scanner & Contact Manager
   - Description: [See app-store-listing.md]
   - Keywords: business card, scanner, OCR, contact, vcard
   - Screenshots: Device-specific (iPhone 6.7", 6.5", 5.5", iPad)
   - Privacy Policy URL: Required
   - App Review Notes: Include test account credentials if needed

#### Required Information
- **App Category**: Business or Productivity
- **Content Rating**: 4+ (No objectionable content)
- **Privacy**: Camera access for scanning, no data collection

### Google Play Store (Google Play Console)

#### Prerequisites
- Google Play Developer Account ($25 one-time)
- Android SDK and build tools
- Google Play Console access

#### Steps
1. **Generate Release APK/AAB**
   ```bash
   npm run release:android
   ```

2. **Upload to Google Play Console**
   - Create new release in production track
   - Upload signed APK/AAB
   - Add release notes

3. **Store Listing**
   - App name: CardScanner
   - Short description: Scan business cards and manage contacts
   - Full description: [See app-store-listing.md]
   - Category: Business
   - Content rating: Everyone
   - Privacy Policy: Required
   - Screenshots: Phone and tablet (7", 10")

#### Required Information
- **App Category**: Business
- **Content Rating**: Everyone
- **Privacy Policy**: Required
- **Target Audience**: Business professionals

### Pre-Submission Checklist

- [ ] App builds successfully on both platforms
- [ ] All tests pass (>90% coverage)
- [ ] Privacy policy published and linked
- [ ] Screenshots captured for all required device sizes
- [ ] App icons generated (1024x1024 iOS, 512x512 Android)
- [ ] Store descriptions written and localized
- [ ] Keywords researched and optimized
- [ ] Test accounts provided for review (if needed)
- [ ] Age rating determined
- [ ] Export compliance information ready (if applicable)

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes and add tests
4. Ensure all tests pass: `npm test`
5. Commit changes: `git commit -m 'Add amazing feature'`
6. Push to branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🔒 Security

Please see [SECURITY.md](SECURITY.md) for information about reporting security vulnerabilities.

## 🔐 Privacy

Your privacy is important to us. See [PRIVACY_POLICY.md](PRIVACY_POLICY.md) for details.

**Key Privacy Points:**
- All OCR processing happens on-device
- No data is sent to external servers
- No user tracking or analytics
- Contact data stored locally only

## 📊 Project Status

- ✅ Core features implemented
- ✅ Unit tests with >90% coverage
- ✅ E2E testing framework
- ✅ CI/CD pipeline configured
- ✅ Release infrastructure prepared
- ✅ Store listing documentation ready

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [documentation](docs/)
2. Search [existing issues](https://github.com/Sensible-Analytics/CardScannerApp/issues)
3. Create a [new issue](https://github.com/Sensible-Analytics/CardScannerApp/issues/new)

## 🙏 Acknowledgments

- [React Native](https://reactnative.dev/) - Cross-platform mobile framework
- [Google ML Kit](https://developers.google.com/ml-kit) - OCR technology
- [Vision Camera](https://mrousavy.com/react-native-vision-camera/) - Camera implementation
- [Detox](https://github.com/wix/Detox) - E2E testing framework