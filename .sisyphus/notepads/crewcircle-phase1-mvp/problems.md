# Unresolved Blockers - CrewCircle Phase 1 MVP

## Current Blockers
None identified yet - project is progressing through sequential tasks.

## Upcoming Challenges
1. **Task 6: Roster Publish Workflow + Realtime Updates**
   - Need to implement Supabase Realtime subscriptions
   - Edge Function for roster publish notifications
   - Copy-forward functionality for weekly rosters

2. **Task 7: Mobile App Shell + Auth**
   - Expo Router setup with file-based routing
   - Supabase auth integration for React Native
   - Push notification token registration

3. **Task 9: Time Clock with GPS + Geofencing**
   - Offline SQLite outbox pattern implementation
   - GPS geofencing with soft-mode warnings
   - Mock location detection

4. **Task 12: Stripe AU Billing**
   - Metered per-employee billing implementation
   - Free tier enforcement at 5 employees
   - Stripe webhook handling

## Technical Debt
- No tests written yet for business logic (Vitest)
- No E2E tests implemented (Playwright)
- No mobile app testing framework set up
- No error tracking configured (Sentry)

## Resource Constraints
- Solo developer - no parallel execution possible
- Limited budget for third-party services
- No design resources - using default UI components
- No QA team - all testing manual or automated

## Risk Mitigation
- Sequential build order minimizes integration issues
- Soft-mode features reduce rejection risk (geofencing, conflicts)
- Australian compliance addressed early (ABN, Privacy Act, Fair Work)
- Supabase Pro budgeted from day 1 to avoid free tier limitations