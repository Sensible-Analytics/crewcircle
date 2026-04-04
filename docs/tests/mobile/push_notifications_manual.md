# Push Notification Manual Test Script

## Precondition
- Physical iOS or Android device
- App installed via EAS preview build (not Expo Go — push doesn't work in Expo Go simulator)
- Employee logged in, push permissions granted (verified in device settings)
- Token exists in `push_tokens` table in database

## Scenario A: Roster published notification

1. Open device — app in background or closed
2. Manager publishes roster on web dashboard
3. Expected within 30 seconds: push notification appears on device lock screen
4. Notification title: "Roster Published"
5. Notification body: contains week date range
6. Tap notification: app opens to Roster tab showing the new roster
7. Save screenshot: `.sisyphus/evidence/mobile-push-roster.png`

## Scenario B: Shift reminder notification

1. Create a shift starting 1h 50min from now
2. Wait until 2 hours before shift start (cron fires every 15 min)
3. Expected: push notification "Your shift starts at [time] at [location]"
4. Save screenshot: `.sisyphus/evidence/mobile-push-reminder.png`

## Scenario C: Invalid token removed

1. Delete the push token from `push_tokens` table manually (simulate device reinstall)
2. Publisher sends a push (via roster publish)
3. Expo Push API returns DeviceNotRegistered
4. In Supabase Edge Function logs: verify token deletion ran
5. In `push_tokens` table: token row no longer exists
6. Save evidence: `.sisyphus/evidence/mobile-push-invalid-token.txt`
