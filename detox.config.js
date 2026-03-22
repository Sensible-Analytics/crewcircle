/**
 * Detox Configuration
 * Learn more at https://wix.github.io/detox/#/configuration
 */

module.exports = {
  testRunner: "jest",
  apps: {
    "ios.debug": {
      type: "ios.app",
      binaryPath:
        "ios/build/Build/Products/Debug-iphonesimulator/CardScannerApp.app",
      build:
        "xcodebuild -workspace ios/CardScannerApp.xcworkspace -scheme CardScannerApp -configuration Debug -sdk iphonesimulator -derivedDataPath ios/build",
    },
    "android.debug": {
      type: "android.apk",
      binaryPath: "android/app/build/outputs/apk/debug/app-debug.apk",
      build:
        "cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug && cd ..",
    },
  },
  devices: {
    simulator: {
      type: "ios.simulator",
      device: {
        type: "iPhone 14",
      },
    },
    emulator: {
      type: "android.emulator",
      device: {
        avdName: "Pixel_4_API_33", // You may need to adjust this to match your AVD name
      },
    },
  },
  configurations: {
    "ios.sim": {
      device: "devices.simulator",
      app: "apps.ios.debug",
    },
    "android.emu": {
      device: "devices.emulator",
      app: "apps.android.debug",
    },
  },
};
