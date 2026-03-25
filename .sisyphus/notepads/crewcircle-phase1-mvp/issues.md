# Issues & Gotchas - CrewCircle Phase 1 MVP

## Technical Issues
- **Metro bundler + pnpm**: React Native Metro bundler doesn't understand pnpm symlinks. Fixed with explicit metro.config.js watchFolders + nodeModulesPaths.
- **Supabase SSR vs client**: Must use @supabase/ssr ONLY in apps/web, never in shared packages or mobile.
- **Service role key**: Never import SUPABASE_SERVICE_ROLE_KEY in shared packages - only in edge functions.
- **RLS policy pattern**: Don't use auth.jwt() -> 'user_metadata' in RLS policies - use DB lookups instead.

## Australian Compliance
- **ABN validation**: Must implement Modulus 89 algorithm for 11-digit ABN validation.
- **Privacy Act**: Australian Privacy Principles require specific data handling disclosures.
- **Fair Work Act**: 7-year record retention requirement - soft delete only on all employee/time tables.
- **Timezones**: Australia has 6 timezone zones with asymmetric DST - all timestamps UTC, display in IANA.
- **NSW GPS notice**: NSW requires 14 days written notice before GPS tracking - add compliance notice in onboarding.

## Business Logic Gotchas
- **Midnight-crossing shifts**: Shift 10pm-6am spans two calendar days - display on starting day.
- **DST transitions**: Store UTC, display wall-clock times - handle DST edge cases in conflict detection.
- **Geofencing radius**: Deputy uses 100m minimum, 150m+ recommended for urban areas.
- **Auto clock-out**: Implement 23-hour auto clock-out with flag for manual review.
- **Mock location detection**: Use react-native-turbo-mock-location-detector to detect mock GPS.

## UI/UX Considerations
- **Roster grid performance**: 30 employees × 7 days must render in <2 seconds.
- **Keyboard accessibility**: All drag operations need keyboard-only alternative (WCAG 2.5.7).
- **Mobile warning**: Show warning on mobile web to use native app instead.
- **Empty states**: "No shifts scheduled this week" with illustration for roster.
- **Loading states**: Skeleton loading while roster data fetches.

## Deployment Risks
- **iOS App Store rejection**: Location tracking must be framed as "arrival notifications".
- **Supabase free tier**: Insufficient for production - budget Supabase Pro ($25/mo) from day 1.
- **Vercel region**: Must set to Sydney (syd1) for low latency to Australian users.
- **Error tracking**: Sentry free tier for both web and mobile - configure before launch.

## Testing Challenges
- **pgTap tests**: Must test tenant isolation, role-based access, soft delete behavior.
- **Mobile testing**: Manual verification via Expo Go (solo dev - no Detox CI budget).
- **E2E testing**: Playwright for web, Maestro for mobile (if budget allows).
- **Performance testing**: 30+ employee roster grid load time must be <2 seconds.