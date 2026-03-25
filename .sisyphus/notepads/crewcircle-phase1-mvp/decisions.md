# Architectural Decisions - CrewCircle Phase 1 MVP

## Database Design
- **Multi-tenant isolation**: All tables include tenant_id with RLS policies
- **Soft delete pattern**: deleted_at column on all employee/time/roster tables
- **Timestamps**: All stored as timestamptz (UTC), displayed in IANA timezone
- **ABN validation**: Modulus 89 algorithm check constraint on tenants table
- **Realtime**: REPLICA IDENTITY FULL on rosters, shifts, clock_events, messages

## Authentication & Authorization
- **Web auth**: @supabase/ssr for Next.js App Router
- **Mobile auth**: @supabase/supabase-js + AsyncStorage for React Native
- **Role hierarchy**: owner > manager > employee
- **Invitation flow**: Email-based, employee sets password on first login
- **Session management**: Auto-refresh tokens, logout, password reset

## Frontend Architecture
- **State management**: Zustand + Immer for roster grid (O(1) updates)
- **Drag-and-drop**: dnd-kit (6KB, multi-container, keyboard accessible)
- **Virtualization**: @tanstack/react-virtual for 50+ employee rows
- **Conflict detection**: Live during drag (visual preview) and on save (soft warnings)
- **Accessibility**: WCAG 2.5.7 compliance - keyboard alternative for all drag operations

## Mobile Architecture
- **Navigation**: Expo Router with file-based routing
- **Tab structure**: Roster, Time Clock, Messages, Profile
- **Offline support**: SQLite outbox pattern for clock events
- **GPS**: react-native-geolocation-service for one-shot high-accuracy fix
- **Geofencing**: Soft mode only (warn, don't block)

## Business Logic
- **Conflict types**: OVERLAP, AVAILABILITY, MAX_HOURS, MIN_REST
- **Shift validation**: start < end, duration ≤ 16 hours, no zero-length shifts
- **Midnight-crossing**: Store as UTC timestamptz, display on starting day
- **Max hours**: 38 ordinary hours per week (AU Modern Awards default)
- **Min rest**: 10 hours between consecutive shifts

## Deployment Strategy
- **Web**: Vercel with Sydney region (syd1) for low latency
- **Mobile**: EAS Build for iOS/Android, submit to App Store/Google Play
- **Database**: Supabase Pro in AWS Sydney (ap-southeast-2)
- **Monitoring**: Vercel analytics + Supabase dashboard + Sentry
- **Domain**: crewcircle.com.au with SSL