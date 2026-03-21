#!/bin/bash

# Build Verification Script
# This script verifies that the app builds successfully for both iOS and Android

set -e

echo "=========================================="
echo "Build Verification Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print success message
print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Function to print error message
print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print warning message
print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Error: package.json not found. Please run this script from the CardScannerApp directory."
    exit 1
fi

print_success "Found package.json"

# Check Node.js version
echo ""
echo "Checking Node.js version..."
NODE_VERSION=$(node -v | cut -d'v' -f2)
REQUIRED_VERSION="18.0.0"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then 
    print_success "Node.js version $NODE_VERSION (>= $REQUIRED_VERSION)"
else
    print_error "Node.js version $NODE_VERSION is too old. Required: >= $REQUIRED_VERSION"
    exit 1
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install --legacy-peer-deps
print_success "Dependencies installed"

# Run linting
echo ""
echo "Running ESLint..."
npm run lint
print_success "ESLint passed"

# Run TypeScript type checking
echo ""
echo "Running TypeScript type checking..."
npx tsc --noEmit
print_success "TypeScript type checking passed"

# Run tests
echo ""
echo "Running tests..."
npm test -- --coverage --passWithNoTests
print_success "Tests passed"

# Check Android build
echo ""
echo "Checking Android build..."
if [ -d "android" ]; then
    print_success "Android directory exists"
    
    # Make gradlew executable
    chmod +x android/gradlew
    
    # Check if Android SDK is available
    if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
        print_warning "Android SDK not found. Skipping Android build."
        print_warning "To build Android, set ANDROID_HOME environment variable."
    else
        echo "Building Android..."
        cd android && ./gradlew assembleDebug
        cd ..
        print_success "Android build successful"
    fi
else
    print_error "Android directory not found"
    exit 1
fi

# Check iOS build (only on macOS)
echo ""
echo "Checking iOS build..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    if [ -d "ios" ]; then
        print_success "iOS directory exists"
        
        # Check if Xcode is installed
        if ! command -v xcodebuild &> /dev/null; then
            print_warning "Xcode not found. Skipping iOS build."
            print_warning "To build iOS, install Xcode from the App Store."
        else
            echo "Installing CocoaPods..."
            cd ios && pod install
            cd ..
            
            echo "Building iOS..."
            cd ios
            xcodebuild \
                -workspace CardScannerApp.xcworkspace \
                -scheme CardScannerApp \
                -configuration Debug \
                -sdk iphonesimulator \
                -destination 'platform=iOS Simulator,name=iPhone 15' \
                clean build
            cd ..
            print_success "iOS build successful"
        fi
    else
        print_error "iOS directory not found"
        exit 1
    fi
else
    print_warning "Not running on macOS. Skipping iOS build."
fi

echo ""
echo "=========================================="
print_success "Build verification completed successfully!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Run 'npm start' to start Metro bundler"
echo "2. Run 'npm run ios' or 'npm run android' to start the app"
echo "3. Or use the CI/CD pipeline for automated builds"
echo ""