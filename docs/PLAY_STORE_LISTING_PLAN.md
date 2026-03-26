# CrewCircle Android Play Store Listing Plan

## 1. App Information

### Basic Details
- **App Name**: CrewCircle
- **Package Name**: `com.crewcircle.mobile`
- **Category**: Business / Productivity
- **Content Rating**: Everyone (may need to update based on features)

### App Description

**Short Description** (80 characters max):
> Workforce management app for Australian businesses

**Full Description** (4000 characters max):
```
CrewCircle - Workforce Management Made Simple

CrewCircle is Australia's leading workforce management solution designed specifically for Australian businesses. Manage your team efficiently with powerful scheduling, time tracking, and communication tools.

KEY FEATURES:

📅 Smart Roster Management
• Drag-and-drop roster scheduling
• Automatic conflict detection
• Publish rosters instantly to your team

⏰ Time Clock with GPS
• Clock in/out with geofence verification
• Track actual hours worked
• Supports multiple work locations

👥 Team Management
• Invite employees with unique codes
• Manage roles (Owner, Manager, Employee)
• Track team availability

📊 Timesheets & Reports
• Automatic timesheet generation
• Export reports for payroll
• Track labor costs

🔔 Real-time Notifications
• Get notified of shift changes
• Receive clock in/out alerts
• Stay updated with team messages

💳 Simple Billing
• Free tier for small teams (up to 5 employees)
• Affordable Starter plan for growing businesses
• No hidden fees

WHY CREWCIRCLE?

✅ Built for Australian businesses
✅ ABN validation built-in
✅ Supports Australia/New Zealand time zones
✅ Compliant with Australian employment regulations
✅ Offline support for time clock

WHO IS IT FOR?

• Small to medium businesses
• Retail and hospitality
• Healthcare and aged care
• Construction and trade businesses
• Any business with shift-based workers

Get started today and transform how you manage your workforce!

Need help? Contact us at support@crewcircle.co
```

---

## 2. Graphics & Media

### App Icons
- [ ] **App Icon**: 1024x1024 PNG (will be resized automatically)
- [ ] **Adaptive Icon** (Android): 512x512 foreground + background
- [ ] **Legacy Icon**: 48x48, 72x72, 96x96, 144x144, 192x192 PNG

### Screenshots Required
Minimum 2 screenshots, recommended 6-8

**Phone Screenshots** (16:9 aspect ratio):
- [ ] Roster view screenshot
- [ ] Time clock screenshot
- [ ] Team management screenshot
- [ ] Notifications/settings screenshot

**Tablet Screenshots** (optional):
- [ ] At least one tablet screenshot

### Feature Graphic (optional but recommended)
- [ ] 1024x500 JPG/PNG

### App Video (optional)
- [ ] YouTube video link (30 seconds - 2 minutes)

---

## 3. Store Presence Checklist

### Required Before Publishing

#### Account Setup
- [ ] Create Google Play Developer account ($25 one-time fee)
- [ ] Set up Google Cloud Console project
- [ ] Configure OAuth consent screen
- [ ] Set up billing (if monetizing)

#### App Configuration
- [ ] Update `app.json` with correct package name
- [ ] Set version number (start at 1.0.0)
- [ ] Configure build variants (debug/release)
- [ ] Set up signing keys (keystore)

#### Privacy & Compliance
- [ ] Create Privacy Policy URL
- [ ] Create Terms of Service URL
- [ ] Add data safety form in Play Console
- [ ] Configure ads identification (if applicable)

---

## 4. Technical Requirements

### Build Configuration
```json
{
  "android": {
    "package": "com.crewcircle.mobile",
    "versionCode": 1,
    "versionName": "1.0.0",
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#E6F4FE"
    }
  }
}
```

### EAS Build Setup
```json
// eas.json updates needed
{
  "build": {
    "production": {
      "android": {
        "buildType": "app-bundle",
        "applicationId": "com.crewcircle.mobile"
      }
    }
  }
}
```

### Required Environment Variables
- [ ] `EXPO_PUBLIC_SUPABASE_URL`
- [ ] `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY` (for future payments)

---

## 5. Pre-Launch Checklist

### Testing
- [ ] Test on Android 8.0+ (API 26+)
- [ ] Test on various screen sizes
- [ ] Test offline functionality
- [ ] Test push notifications
- [ ] Test geofence clock in/out
- [ ] Internal testing track with 5+ testers

### Content Preparation
- [ ] Write app description
- [ ] Prepare screenshots
- [ ] Create/optimize app icons
- [ ] Write privacy policy
- [ ] Write terms of service
- [ ] Prepare support contact info

### Legal
- [ ] Privacy Policy published
- [ ] Terms of Service published
- [ ] Data safety form completed
- [ ] In-app age verification (if needed)

---

## 6. Launch Timeline

### Week 1: Setup
- [ ] Create Play Developer account
- [ ] Configure EAS Build
- [ ] Set up app signing
- [ ] Run internal tests

### Week 2: Content
- [ ] Create all graphics
- [ ] Write descriptions
- [ ] Publish legal pages
- [ ] Prepare screenshots

### Week 3: Testing & Polish
- [ ] Closed testing track
- [ ] Fix bugs from testing
- [ ] Optimize app performance
- [ ] Finalize store listing

### Week 4: Launch
- [ ] Submit for review
- [ ] Monitor review status
- [ ] Prepare marketing materials
- [ ] Plan rollout announcement

---

## 7. Post-Launch

### Monitoring
- [ ] Set up crash reporting
- [ ] Monitor Play Store reviews
- [ ] Track analytics (Firebase, Mixpanel)
- [ ] Set up error alerting

### Updates
- [ ] Plan for regular updates
- [ ] Bug fix release process
- [ ] Feature release workflow
- [ ] Version update procedure

---

## 8. Files to Update

### app.json (current state needs updates)
```javascript
export default {
  name: 'CrewCircle',
  slug: 'crewcircle',
  version: '1.0.0',
  // ... add all required fields
}
```

### eas.json (needs production config)
```json
{
  "build": {
    "production": {
      "android": {
        "applicationId": "com.crewcircle.mobile"
      }
    }
  }
}
```

### Required Assets (check assets folder)
- [ ] icon.png (1024x1024)
- [ ] adaptive-icon.png (512x512)
- [ ] splash.png
- [ ] favicon.png
- [ ] Screenshots folder

---

## 9. Commands Reference

### Build Commands
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to EAS
eas login

# Build for Android (internal testing)
eas build --platform android --profile preview

# Build for Android (production)
eas build --platform android --profile production

# Submit to Play Store
eas submit --platform android --latest
```

### Local Build (without EAS)
```bash
# Generate native Android project
npx expo prebuild --platform android

# Build APK locally
cd android && ./gradlew assembleDebug
```

---

## 10. Support Resources

- Expo Documentation: https://docs.expo.dev
- EAS Build: https://docs.expo.dev/eas/
- Play Store Console: https://play.google.com/console
- Google Play Developer Support: https://support.google.com/googleplay/android-developer/
