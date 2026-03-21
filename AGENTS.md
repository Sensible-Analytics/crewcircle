# CardScannerApp - Agent Guidelines

This file provides instructions for AI agents operating in this repository. It covers project setup, development workflows, code style, and best practices.

## 📋 Repository-Specific Instructions

Based on the project documentation, please note the following repository-specific considerations:

### Android Build Issues

- The Android build currently has dependency resolution issues with androidx libraries
- Error: `Cannot access 'androidx.core.content.OnConfigurationChangedProvider'`
- This is a known issue being worked on (see docs/BUILD_SUMMARY.md)
- For now, focus development on iOS or web testing when possible
- Storage system uses `@react-native-async-storage/async_storage` (not MMKV as in earlier versions)

### Current Development Status

- Core features are implemented: scanning, OCR, contact parsing, storage, export
- Unit tests exist for storage and contact parser utilities
- iOS build requires macOS and Xcode for testing
- Refer to docs/PROJECT_SUMMARY.md for completed features and known issues
- See docs/LAUNCH_PLAN.md for future feature plans and product vision

### Key Technical Decisions

- Switched from `expo-file-system/expo-sharing` to `react-native-fs/react-native-share`
- Changed OCR from `react-native-tesseract-ocr` to `rn-mlkit-ocr` (Google ML Kit)
- Updated storage from `react-native-mmkv` to `@react-native-async-storage/async-storage`
- All storage utility calls are now async/await compatible

## 📋 Project Overview

CardScannerApp is a React Native application for scanning business cards using OCR technology. Built with:

- React Native 0.74.0
- TypeScript
- react-native-vision-camera for camera functionality
- rn-mlkit-ocr for OCR processing
- MMKV (via @react-native-async-storage/async-storage) for persistent storage
- React Navigation for screen navigation
- Jest for testing

## 🛠️ Development Commands

### Package Management

```bash
# Install dependencies
npm install

# Install iOS pods
cd ios && pod install && cd ..
```

### Running the Application

```bash
# Start Metro bundler
npm start

# Run on iOS simulator
npm run ios

# Run on Android emulator
npm run android
```

### Linting

```bash
# Run ESLint on entire project
npm run lint

# Run ESLint on specific files/directories
npx eslint src/screens/ScannerScreen.tsx
npx eslint src/utils/
```

### Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npx jest src/screens/ScannerScreen.test.tsx

# Run tests with coverage
npm test -- --coverage

# Run a single test (using test name pattern)
npm test -- -t "renders without crashing"
```

### Type Checking

```bash
# Run TypeScript type checking
npx tsc --noEmit
```

## 📁 Project Structure

```
CardScannerApp/
├─ src/
│  ├─ navigation/      # Navigation containers
│  ├─ screens/         # Screen components
│  │  ├─ ScannerScreen.tsx    # Main scanning interface
│  │  ├─ ContactsScreen.tsx   # View saved contacts
│  │  ├─ SettingsScreen.tsx   # App configuration
│  │  └─ EditContactScreen.tsx # Edit contact details
│  ├─ utils/           # Utility functions
│  │  ├─ storage.ts           # AsyncStorage wrapper
│  │  ├─ exportUtils.ts       # VCard export functionality
│  │  ├─ contactParser.ts     # OCR text parsing logic
│  │  └─ errorHandler.ts      # Error display utilities
│  └─ assets/          # Static assets (images, icons)
├─ android/            # Android project files
├─ ios/                # iOS project files
└─ ...                 # Configuration files
```

## 🎨 Code Style Guidelines

### File Organization

- Component files use `.tsx` extension
- Utility files use `.ts` extension
- Test files follow `[name].test.tsx` naming convention
- Group related imports:
  1. React imports
  2. React Native imports
  3. Third-party library imports
  4. Relative project imports
  5. Type definitions

### TypeScript Usage

- Strict typing enabled via `tsconfig.json` (inherited from @react-native/typescript-config)
- Define interfaces/types for props and state
- Use `any` only when absolutely necessary (with comment explaining why)
- Prefer explicit return types for functions
- Use TypeScript enums for finite sets of values

### Import Order

1. React imports
2. React Native core components
3. Third-party libraries (alphabetical)
4. Project utilities (relative paths)
5. Stylesheets (at bottom of file)
6. Type definitions (if separate)

Example:

```typescript
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import storageUtils from "../utils/storage";
import { ContactType } from "../types/contactTypes";
import styles from "./styles";
```

### Naming Conventions

- Components: PascalCase (e.g., `ScannerScreen`)
- Functions/variables: camelCase (e.g., `handleCapture`, `isProcessing`)
- Constants: UPPER_SNAKE_CASE (e.g., `DEFAULT_OCR_LANGUAGES`)
- Files: PascalCase for components, camelCase for utilities
- Test files: `[ComponentName].test.tsx`
- Private methods: prefix with `_` (e.g., `_processImage`)

### React Native Specific

- Use `StyleSheet.create()` for styles
- Prefer functional components with hooks over class components
- Use `useCallback` for functions passed as props to prevent unnecessary re-renders
- Use `useMemo` for expensive calculations
- Platform-specific code: Use `Platform.OS` or platform-specific extensions (`.ios.ts`, `.android.ts`)
- Accessibility: Always provide `accessibilityLabel` for interactive elements
- Images: Require dimensions for performance

### Error Handling

- Use try/catch for asynchronous operations
- Log errors to console with context: `console.error('Failed to save contact:', error)`
- Use the centralized error handler: `showErrorAlert(error, 'Operation description')`
- Show user-friendly alerts for recoverable errors
- Fail silently only for non-critical operations (with logging)
- Never leave empty catch blocks

### Async/Await Patterns

- Always await promises or explicitly handle them
- Use try/catch for error handling in async functions
- Show loading states during long operations
- Disable UI elements during processing to prevent double-submits
- Clean up resources in finally blocks when necessary

### Testing Guidelines

- Test files placed alongside source files with `.test.tsx` suffix
- Mock external dependencies (camera, OCR, storage) using `jest.mock()`
- Test both positive and negative cases
- Use `@testing-library/react-native` for component testing
- Follow AAA pattern: Arrange, Act, Assert
- Test user interactions and state changes
- Mock AsyncStorage with Jest mock implementations
- Keep tests focused and independent

### Comments & Documentation

- Use JSDoc for complex functions and utility methods
- Explain why, not what (unless the what is non-obvious)
- TODO comments: Include ticket/reference if applicable
- Remove commented-out code before committing
- Use `// FIXME:` for known issues needing attention
- Use `// HACK:` for temporary solutions

### Platform-Specific Code

- Use `Platform.select()` for simple platform differences
- Create platform-specific files for complex differences: `[name].ios.ts` and `[name].android.ts`
- Import Platform from 'react-native': `import { Platform } from 'react-native'`
- Test on both iOS and Android when making platform-specific changes

## 🔧 Configuration Files

### ESLint

Based on `@react-native/eslint-config` with additional overrides:

- Uses `@typescript-eslint/parser` for TypeScript files
- Enforces consistent formatting via Prettier integration
- React Native specific rules enabled
- Jest environment configured for test files

### Prettier

- Uses default React Native Prettier configuration
- Single quotes, trailing commas, semicolons enabled
- 80 character line width limit

### Jest

- Preset: `react-native`
- Automatically mocks native modules
- Test timeout: 5000ms
- Setup files configured for React Native testing

### TypeScript

- Configuration inherited from `@react-native/typescript-config`
- Strict mode enabled
- JSX factory configured for React Native
- Module resolution configured for Metro bundler

## 🚦 Best Practices

### Performance

- Use `React.memo()` for components that render frequently
- Implement `useCallback` and `useMemo` appropriately
- Optimize image loading with proper dimensions and caching
- Minimize bridge crossings between JS and native
- Use FlatList for long lists of data
- Avoid anonymous functions in render props
- Use `useState` updater form when new state depends on previous state

### Storage

- MMKV/AsyncStorage is asynchronous - always await calls
- Store only JSON-serializable data
- Use try/catch for all storage operations
- Provide default values for storage reads
- Consider data size limitations (avoid storing large blobs)

### Camera & OCR

- Always request permissions before accessing camera
- Handle permission denials gracefully
- Release camera resources when component unmounts
- Throttle OCR processing to prevent overheating
- Provide visual feedback during processing
- Handle different image orientations correctly

### Navigation

- Use React Navigation's native stack for performance
- Reset navigation state appropriately to prevent back-button issues
- Pass parameters via route.params
- Use navigation events for screen lifecycle handling
- Deep linking configuration in project files

### Accessibility

- Provide meaningful `accessibilityLabel` for all interactive elements
- Test with screen readers (VoiceOver/TalkBack)
- Ensure sufficient color contrast
- Support dynamic type scaling
- Avoid conveying information by color alone
- Make touch targets at least 48x48 dp

### Internationalization

- All user-facing strings should be externalized (future improvement)
- OCR language selection available in settings
- Date/number formatting should respect locale
- Right-to-left language support considered in layout

## 📝 Contributing Guidelines

### Making Changes

1. Create a feature branch from main
2. Write tests for new functionality
3. Implement changes following existing patterns
4. Ensure linting passes (`npm run lint`)
5. Ensure tests pass (`npm test`)
6. Submit pull request with clear description

### Code Review

- Look for adherence to style guidelines
- Verify proper error handling
- Check for performance implications
- Ensure tests cover new functionality
- Confirm platform compatibility
- Validate accessibility considerations

### Documentation

- Update README.md for significant feature changes
- Document new utility functions with JSDoc
- Add comments for complex business logic
- Keep inline comments updated with code changes

## 🧪 Testing Strategy

### Unit Tests

- Test utility functions in isolation
- Mock external dependencies
- Test edge cases and error conditions
- Aim for high coverage on business logic

### Component Tests

- Test rendering with different props
- Test user interactions and state changes
- Mock navigation and route parameters
- Test accessibility properties

### Integration Tests

- Test navigation flows
- Test data persistence cycles
- Test permission handling flows
- Test OCR to storage pipeline

### E2E Tests (Future)

- Consider Detox for end-to-end testing
- Test critical user journeys
- Test on both iOS and Android emulators
- Test offline functionality

## ⚠️ Common Pitfalls to Avoid

### React Native Specific

- Forgetting to await AsyncStorage calls
- Using array indices as keys in FlatList
- Not cleaning up event listeners/subscriptions
- Blocking the JS thread with synchronous operations
- Neglecting to update pod files after adding native dependencies
- Using disabled={false} instead of disabled={!condition}

### TypeScript

- Overusing `any` type
- Not utilizing TypeScript's inference capabilities
- Ignoring tsconfig path mappings
- Missing return types on public functions
- Inconsistent use of nullable types

### Testing

- Testing implementation details instead of behavior
- Not mocking external services properly
- Tests that depend on execution order
- Over-reliance on snapshot tests without proper assertions
- Forgetting to cleanup mocks between tests

### Performance

- Causing unnecessary re-renders
- Large initial bundle size
- Synchronous operations on UI thread
- Memory leaks from subscriptions
- Inefficient image loading

## 🔄 Parallel Development Guidelines

When working concurrently:

- Communicate changes to shared utilities/services
- Use feature flags for incomplete features
- Regularly pull main branch to avoid conflicts
- Resolve merge conflicts promptly
- Test integration points frequently
- Update documentation as you go
