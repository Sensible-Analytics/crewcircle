# Store Assets

This directory contains assets required for app store listings.

## Directory Structure

```
store-assets/
├── ios/
│   └── screenshots/     # iOS screenshots (1290x2796, 1242x2688, etc.)
├── android/
│   └── screenshots/     # Android screenshots (1080x1920, etc.)
├── icons/               # App icons in various sizes
└── graphics/            # Promotional graphics and feature images
```

## Required Assets

### iOS Screenshots
- iPhone 6.7" (15 Pro Max): 1290 x 2796
- iPhone 6.5" (11 Pro Max): 1242 x 2688
- iPhone 5.5" (8 Plus): 1242 x 2208
- iPad Pro 12.9": 2048 x 2732

### Android Screenshots
- Phone: 1080 x 1920
- 7" Tablet: 1200 x 1920
- 10" Tablet: 1600 x 2560

### App Icons
- iOS: 1024 x 1024 (App Store), various sizes for devices
- Android: 512 x 512 (Play Store), various densities

### Feature Graphics
- Google Play Feature Graphic: 1024 x 500 pixels

## How to Generate Screenshots

### iOS
1. Run the app in Xcode simulator
2. Use `Cmd+S` to take screenshots
3. Export in required sizes using Xcode or third-party tools

### Android
1. Run the app in Android Emulator
2. Use emulator's screenshot tool
3. Resize using Android Studio's Image Asset Studio

### Automated Screenshots
Consider using:
- `fastlane snapshot` for iOS
- `fastlane screengrab` for Android
- Detox test automation (already configured)

## Asset Guidelines

### Screenshots
- Show actual app functionality
- Use consistent device frames
- Highlight key features
- Include diverse content
- Avoid sensitive information

### Icons
- Simple and recognizable
- Consistent with brand
- Work at small sizes
- No text in icon

### Graphics
- High quality
- Consistent color scheme
- Clear value proposition
- Mobile-optimized