# Card Scanner App

A business card scanner application built with React Native that allows users to scan business cards, extract contact information using OCR, save contacts, and export them in various formats.

## Features

- Scan business cards using device camera
- Extract text using OCR (Tesseract)
- Parse contact information (name, email, phone, company, website)
- Save contacts to device storage (MMKV)
- Export contacts as VCard
- View and manage saved contacts
- Configure OCR languages
- Basic settings (auto-save, notifications, data usage)

## Project Structure

```
CardScannerApp/
├─ src/
│  ├─ navigation/      # Navigation containers
│  ├─ screens/         # Screen components
│  ├─ utils/           # Utility functions (storage, export, error handling)
│  └─ assets/          # Static assets (images, icons)
├─ android/            # Android project files
├─ ios/                # iOS project files
└─ ...                 # Configuration files
```

## Setup Instructions

### Prerequisites

- Node.js (v14 or later)
- npm or yarn
- Xcode (for iOS development)
- Android Studio (for Android development)
- CocoaPods (for iOS dependencies)

### Installation

1. Clone the repository
2. Navigate to the project directory:
   ```bash
   cd business-card-scanner/CardScannerApp
   ```
3. Install JavaScript dependencies:
   ```bash
   npm install
   ```
4. Install iOS dependencies:
   ```bash
   cd ios && pod install && cd ..
   ```

### Running the App

#### iOS Simulator
```bash
npm run ios
```

#### Android Emulator
```bash
npm run android
```

## Development Status

### Completed Features
- [x] Project setup with React Native 0.74.0
- [x] Navigation structure (Scan, Contacts, Settings tabs)
- [x] Scanner screen with camera integration
- [x] OCR text extraction using Tesseract
- [x] Contact information parsing
- [x] Contact saving using MMKV storage
- [x] Contact export as VCard
- [x] Contacts screen to view saved contacts
- [x] Settings screen for configuration
- [x] Basic error handling

### In Progress
- [ ] Improve OCR accuracy and language support
- [ ] Enhance contact parsing with more sophisticated NLP
- [ ] Add batch scanning capability
- [ ] Implement contact deduplication
- [ ] Add CSV export functionality
- [ ] Improve UI/UX with loading states and better feedback
- [ ] Add unit and integration tests
- [ ] Performance optimization

### Future Features (Post-MVP)
- [ ] CRM integrations (Salesforce, HubSpot, etc.)
- [ ] AI-powered contact insights and scoring
- [ ] Team collaboration features
- [ ] Advanced analytics and reporting
- [ ] Offline-first architecture with conflict resolution
- [ ] Customizable contact fields
- [ ] Voice notes attachment to contacts
- [ ] LinkedIn integration

## Technical Stack

- **Framework**: React Native 0.74.0
- **Language**: TypeScript
- **State Management**: React hooks with MMKV for persistent storage
- **Navigation**: React Navigation (native stack and bottom tabs)
- **Camera**: react-native-vision-camera
- **OCR**: react-native-tesseract-ocr
- **Storage**: MMKV (mobile key-value storage)
- **Export**: expo-file-system and expo-sharing
- **UI Components**: Custom components with StyleSheet and @expo/vector-icons
- **Error Handling**: Custom error utility with alert display

## Configuration

### OCR Languages
The app supports multiple languages for OCR. By default, only English is enabled. To add more languages:
1. Go to Settings
2. Select the desired languages under OCR Settings
3. The app will use the selected languages for text recognition

### Storage
Contacts are stored locally using MMKV. Data persists between app sessions but is removed when the app is deleted.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- React Native community for the excellent framework
- Tesseract OCR team for the open-source OCR engine
- Expo for file system and sharing utilities
- MMKV for fast persistent storage