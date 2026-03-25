# CrewCircle Phase 1 MVP — Australia-First Launch

## TL;DR

> **Quick Summary**: Build the Phase 1A MVP of CrewCircle — a rostering, time clock, and team management app for Australian SMBs. Solo founder builds sequentially using Next.js + React Native + Supabase. Ship to first 10 Melbourne businesses within 12 weeks.
>
> **Deliverables**:
> - Manager web dashboard (Next.js) with drag-and-drop rostering
> - Employee mobile app (React Native/Expo) — view roster, set availability, clock in/out
> - Real-time roster publishing with push notifications
> - GPS-based time clock with soft-mode geofencing
> - Timesheet generation + CSV export
> - Multi-tenant auth with RLS security
>
> **Estimated Effort**: Large (12 weeks solo dev for Phase 1A)
> **Parallel Execution**: NO — solo developer, sequential build
> **Critical Path**: Infra → DB/Auth → Roster Core → Mobile Shell → Time Clock → Notifications → Export → Polish

---

## Context

### Original Request
Build an all-in-one employee management platform for Australian small businesses, launching Australia-first with zero external funding. Phase 1 focuses on achieving feature parity with spreadsheet-based rostering, priced at $4 AUD/employee/month.

### Interview Summary
**Key Decisions**:
- Australia-first launch (smaller, less crowded market; Xero = distribution channel)
- Zero funding — each phase funded by revenue from previous phase
- Solo founder-developer building everything
- Tech stack: Next.js + React Native (Expo) + Supabase
- Tests after implementation (not TDD)
- Phase 1 split into 1A (shippable MVP, 12 weeks) and 1B (collaborative features, 6 weeks)

**Research Findings**:
- 310,000 AU businesses with 5-100 employees in target market
- Competitors: Deputy ($9.75/user), RosterElf ($6-7/emp), Employment Hero ($19-49/emp)
- Deputy's auto-scheduling ignores availability (confirmed weakness)
- Xero has 60-75% AU market share — Xero App Marketplace is #1 distribution
- AU payroll = 122 Modern Awards, STP Phase 2 — NOT building payroll in Phase 1
- 40-50% of micro businesses still use paper/spreadsheets

### Metis Review
**Identified Gaps** (addressed):
- Phase 1 scope too large for solo dev in 4 months → Split into 1A (12 weeks) + 1B (6 weeks)
- Messaging scope creep risk → Locked down to text-only, no search, no reactions, deferred to Phase 1B
- Shift swap scope creep → Simplified to request-based, deferred to Phase 1B
- Supabase free tier insufficient → Budget Supabase Pro ($25/mo) from day 1
- Multi-tenant schema needed from day 1 → All tables include tenant_id + location_id
- AU timezone complexity (6 zones, asymmetric DST) → All timestamps UTC, display in IANA
- iOS App Store rejection risk for location tracking → Frame as "arrival notifications"
- 7-year record retention required → Soft delete only on all employee/time tables
- React Native Metro bundler doesn't understand pnpm symlinks → Explicit metro.config.js fix needed

---

## Work Objectives

### Core Objective
Build a shippable Phase 1A MVP that lets a small Australian business (cafe, restaurant, retail shop) replace their paper/spreadsheet roster with a digital platform — in 12 weeks of solo development.

### Concrete Deliverables
- Turborepo monorepo with apps/web, apps/mobile, packages/*, supabase/
- Supabase project with all tables, RLS policies, edge functions
- Next.js web app for managers (rostering, timesheets, team management)
- Expo/React Native mobile app for employees (view roster, availability, clock in/out)
- Push notification system (roster published, shift reminders)
- CSV timesheet export
- Stripe AU subscription billing
- Deployed to Vercel (web) + App Store + Google Play (mobile)

### Definition of Done
- [ ] A Melbourne cafe owner can sign up, add 10 employees, build a weekly roster, and publish it
- [ ] All 10 employees can download the app, see their shifts, and set availability
- [ ] Employees can clock in/out with GPS verification
- [ ] Manager can view timesheets and export CSV
- [ ] Free tier works for ≤5 employees; paid tier charges $4/emp/mo via Stripe
- [ ] All data stays in AWS ap-southeast-2 (Sydney)
- [ ] `pnpm turbo build` passes; `supabase test db` passes all RLS tests

### Must Have
- Multi-tenant data isolation (RLS with pgTap tests)
- UTC timestamp storage with IANA timezone display
- Soft delete on all employee/time/roster tables (7-year retention)
- Multi-location schema design (even if single-location UI in Phase 1A)
- Offline-capable clock-in (SQLite outbox pattern)
- Geofencing in soft mode only (warn, don't block)
- ABN validation (Modulus 89) for business registration
- Push notifications via Expo Push + Supabase Edge Functions
- Australian Privacy Act compliant (privacy policy, data handling)

### Must NOT Have (Guardrails)
- ❌ Award interpretation, penalty rates, or overtime calculation
- ❌ Xero/MYOB payroll integration (Phase 2)
- ❌ SMS notifications (requires sender ID registration, per-message cost)
- ❌ Kiosk/tablet mode (Phase 2)
- ❌ Recurring/repeating shift patterns (copy-forward is sufficient)
- ❌ Hard-block geofencing (soft mode only — warn, don't prevent clock-in)
- ❌ File uploads in messaging
- ❌ Message search, editing, deletion, read receipts, typing indicators
- ❌ Auto-scheduling or AI features
- ❌ HR onboarding, document management, compliance tools
- ❌ Leave management (Phase 2)
- ❌ Direct `SUPABASE_SERVICE_ROLE_KEY` imports in shared packages
- ❌ Hard-deleting any employee or time record
- ❌ Local time string storage (always UTC + timezone identifier)
- ❌ `auth.jwt() -> 'user_metadata'` in RLS policies (use DB lookups)

---

## Verification Strategy

> **ZERO HUMAN INTERVENTION** — ALL verification is agent-executed.

### Test Decision
- **Infrastructure exists**: NO (greenfield)
- **Automated tests**: Tests after implementation
- **Framework**: Vitest (unit/integration) + pgTap (RLS) + Playwright (web E2E)
- **Test pyramid**: pgTap for RLS → Vitest for business logic → Playwright for web → Manual/Maestro for mobile

### QA Policy
Every task includes agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario-slug}.{ext}`.

- **Web UI**: Playwright — navigate, interact, assert DOM, screenshot
- **Mobile**: Manual verification via Expo Go (solo dev — no Detox CI budget)
- **API/Backend**: Bash (curl) + Supabase CLI
- **Database/RLS**: pgTap via `supabase test db`
- **Business Logic**: Vitest in packages/validators/

---

## Execution Strategy

### Sequential Build Order (Solo Developer)

```
Phase 1A — "Beat Spreadsheets" (12 weeks)

Week 1-2: Foundation
├── Task 1: Monorepo + Infrastructure setup [quick]
├── Task 2: Supabase project + Database schema + RLS [deep]
└── Task 3: Auth system (signup, login, invitations) [unspecified-high]

Week 3-5: Roster Core (Web)
├── Task 4: Roster grid UI with drag-and-drop [visual-engineering]
├── Task 5: Shift CRUD + conflict detection [deep]
└── Task 6: Roster publish workflow + realtime [unspecified-high]

Week 6-8: Mobile App
├── Task 7: Expo/React Native app shell + auth [unspecified-high]
├── Task 8: Employee roster view + availability [visual-engineering]
└── Task 9: Time clock with GPS + geofencing [deep]

Week 9-10: Notifications + Export
├── Task 10: Push notifications system [unspecified-high]
└── Task 11: Timesheet generation + CSV export [unspecified-high]

Week 11-12: Billing + Polish + Deploy
├── Task 12: Stripe AU billing + free/paid tiers [unspecified-high]
├── Task 13: Landing page + privacy policy + terms [visual-engineering]
└── Task 14: Deploy web + submit mobile apps [quick]

Phase 1B — "Collaborative Features" (6 weeks, after 1A ships)
├── Task 15: Shift swap / open shifts [unspecified-high]
├── Task 16: Team messaging [unspecified-high]
└── Task 17: Geofencing refinements + anti-spoofing [deep]

Sequential (no parallelism — solo developer)
Critical Path: T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11 → T12 → T13 → T14
```

### Dependency Matrix

| Task | Depends On | Blocks |
|---|---|---|
| T1 (Infra) | — | All tasks |
| T2 (DB/Schema) | T1 | T3, T4, T5, T6, T7 |
| T3 (Auth) | T1, T2 | T4, T7, T12 |
| T4 (Roster Grid) | T2, T3 | T5, T6, T8 |
| T5 (Shift CRUD) | T4 | T6, T9, T11 |
| T6 (Publish) | T5 | T10, T8 |
| T7 (Mobile Shell) | T2, T3 | T8, T9 |
| T8 (Mobile Roster) | T7, T6 | T9 |
| T9 (Time Clock) | T7, T5 | T11 |
| T10 (Push Notifs) | T6, T7 | T14 |
| T11 (Timesheets) | T9 | T14 |
| T12 (Billing) | T3 | T14 |
| T13 (Landing) | — | T14 |
| T14 (Deploy) | T10, T11, T12, T13 | — |

### Agent Dispatch Summary
All tasks dispatched to `quick`, `deep`, `unspecified-high`, or `visual-engineering` as noted above.

---

## TODOs

- [x] 1. Monorepo + Infrastructure Setup

  **What to do**:
  - Initialize Turborepo monorepo with pnpm workspaces
  - Create directory structure: `apps/web` (Next.js 15), `apps/mobile` (Expo/React Native), `packages/supabase` (client + types), `packages/validators` (Zod schemas), `packages/ui-shared` (shared hooks/utils), `supabase/` (CLI project root)
  - Configure `turbo.json` with build/lint/test pipelines
  - Set up `apps/web` with Next.js 15 App Router, TypeScript, Tailwind CSS, ESLint, Prettier
  - Set up `apps/mobile` with Expo SDK 52+, TypeScript, NativeWind (Tailwind for RN)
  - Fix Metro bundler pnpm symlink issue in `metro.config.js` (explicit `watchFolders` + `nodeModulesPaths`)
  - Initialize Supabase project via CLI (`supabase init`), link to hosted project
  - Set up Supabase Pro ($25/mo) in AWS Sydney region (ap-southeast-2)
  - Configure environment variables (`.env.local` for web, `app.config.ts` for mobile)
  - Set up GitHub repo with `.gitignore`, branch protection on `main`
  - Add CI via GitHub Actions: `pnpm turbo build && pnpm turbo lint`

  **Must NOT do**:
  - Do not add any feature code, database tables, or UI components
  - Do not use `@supabase/ssr` in `packages/supabase` (that's for `apps/web` only)
  - Do not import service role key in any shared package

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Can Run In Parallel**: NO (solo dev; first task)
  - **Blocks**: All subsequent tasks
  - **Blocked By**: None

  **References**:
  - Metis research: Turborepo + pnpm monorepo structure with `packages/supabase/client.browser.ts` and `client.server.ts` split
  - Metis directive: Metro bundler needs explicit `metro.config.js` workaround for pnpm symlinks
  - Supabase docs: `supabase init` + `supabase link`

  **Acceptance Criteria**:
  - [ ] `pnpm install` completes without errors
  - [ ] `pnpm turbo build` builds all apps and packages successfully
  - [ ] `pnpm turbo lint` passes with 0 errors
  - [ ] `apps/web`: `pnpm --filter web dev` starts Next.js on localhost:3000
  - [ ] `apps/mobile`: `pnpm --filter mobile start` opens Expo dev server
  - [ ] `supabase status` shows linked project in ap-southeast-2
  - [ ] GitHub Actions CI runs and passes on push to `main`

  **QA Scenarios**:
  ```
  Scenario: Monorepo builds successfully
    Tool: Bash
    Steps:
      1. Run `pnpm turbo build`
      2. Assert exit code 0
      3. Verify `apps/web/.next/` directory exists
    Expected Result: All 5 packages/apps build without errors
    Evidence: .sisyphus/evidence/task-1-monorepo-build.txt

  Scenario: Shared package imports work cross-platform
    Tool: Bash
    Steps:
      1. Add a test Zod schema to packages/validators/src/index.ts
      2. Import it in apps/web and apps/mobile
      3. Run `pnpm turbo build`
    Expected Result: Both apps compile with shared import
    Evidence: .sisyphus/evidence/task-1-shared-import.txt
  ```

  **Commit**: YES
  - Message: `chore(infra): initialize turborepo monorepo with Next.js, Expo, and Supabase`
  - Pre-commit: `pnpm turbo build && pnpm turbo lint`

- [x] 2. Database Schema + RLS Policies + pgTap Tests

  **What to do**:
  - Design and create all core tables via Supabase migrations:
    - `tenants` (id, name, abn, timezone, plan, created_at, deleted_at)
    - `locations` (id, tenant_id, name, address, latitude, longitude, geofence_radius_m, timezone, deleted_at)
    - `profiles` (id references auth.users, tenant_id, role enum(owner/manager/employee), first_name, last_name, email, phone, deleted_at)
    - `tenant_members` (tenant_id, profile_id, role, invited_at, accepted_at, deleted_at)
    - `rosters` (id, tenant_id, location_id, week_start date, status enum(draft/published/archived), published_at, published_by, deleted_at)
    - `shifts` (id, tenant_id, location_id, roster_id, profile_id, start_time timestamptz, end_time timestamptz, role_label, notes, deleted_at)
    - `availability` (id, tenant_id, profile_id, day_of_week int, start_time time, end_time time, is_available boolean)
    - `clock_events` (id, tenant_id, profile_id, location_id, shift_id nullable, type enum(clock_in/clock_out), recorded_at timestamptz, latitude, longitude, accuracy_m, is_within_geofence boolean, source enum(mobile/kiosk/manual), idempotency_key uuid, deleted_at)
    - `messages` (id, tenant_id, channel_id, sender_id, content text, created_at, deleted_at)
    - `channels` (id, tenant_id, type enum(team/direct), name, member_ids uuid[], deleted_at)
  - ALL timestamps as `timestamptz` (UTC)
  - ALL tables include `tenant_id` and `deleted_at` columns
  - Create `is_tenant_member(p_tenant_id uuid)` SECURITY DEFINER function using `(SELECT auth.uid())`
  - Create RLS policies on EVERY table using `is_tenant_member()`
  - Set `REPLICA IDENTITY FULL` on rosters, shifts, clock_events, messages (Realtime-enabled)
  - Create indexes: tenant_id on all tables, (roster_id, profile_id) on shifts, (profile_id, recorded_at) on clock_events
  - Write pgTap tests: tenant isolation (tenant A cannot see tenant B data), role-based access (employee cannot delete shifts), soft delete (deleted records excluded from default queries)
  - ABN validation check constraint (Modulus 89 algorithm)

  **Must NOT do**:
  - Do not create award interpretation tables, payroll tables, or leave tables
  - Do not hard-delete any record — soft delete only
  - Do not use `auth.jwt() -> 'user_metadata'` in RLS policies

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Blocks**: T3, T4, T5, T6, T7
  - **Blocked By**: T1

  **References**:
  - Metis directive: `is_tenant_member()` SECURITY DEFINER function with `(SELECT auth.uid())` wrapping
  - Metis directive: `REPLICA IDENTITY FULL` on all Realtime-enabled tables
  - Metis directive: Soft delete with `deleted_at` column on all tables (Fair Work Act 7-year retention)
  - ABN validation: Modulus 89 algorithm on 11 digits

  **Acceptance Criteria**:
  - [ ] `supabase db push` applies all migrations without errors
  - [ ] `supabase test db` runs pgTap tests — all pass
  - [ ] RLS test: authenticated user of tenant A queries shifts → sees only tenant A shifts
  - [ ] RLS test: authenticated user of tenant A queries tenant B shifts → returns empty set
  - [ ] ABN constraint: inserting tenant with ABN '51824753556' succeeds; ABN '12345678901' fails

  **QA Scenarios**:
  ```
  Scenario: Tenant data isolation verified via pgTap
    Tool: Bash
    Steps:
      1. Run `supabase test db`
      2. Assert all tests pass including: 'Cannot see other tenant shifts', 'Cannot see other tenant clock events', 'Cannot see other tenant employees'
    Expected Result: All pgTap tests PASS (0 failures)
    Evidence: .sisyphus/evidence/task-2-rls-tests.txt

  Scenario: Soft delete excludes records from queries
    Tool: Bash (psql)
    Steps:
      1. Insert a shift, then UPDATE set deleted_at = now()
      2. SELECT from shifts where roster_id = X
      3. Assert deleted shift is NOT in results (default view excludes soft-deleted)
    Expected Result: Soft-deleted records invisible in normal queries
    Evidence: .sisyphus/evidence/task-2-soft-delete.txt
  ```

  **Commit**: YES
  - Message: `chore(db): add core schema with tenants, locations, employees, shifts, rosters, RLS policies, and pgTap tests`
  - Pre-commit: `supabase test db`

- [x] 3. Auth System — Signup, Invitations, Role-Based Access

  **What to do**:
  - Business signup flow (web): email/password → create auth user → create tenant (with ABN validation) → create default location → create profile with role=owner → redirect to dashboard
  - Employee invitation flow: manager enters employee email/phone → creates profile row with role=employee → sends invitation email (Supabase Auth magic link or email invite) → employee clicks link → sets password → profile marked as accepted
  - Auth context in `packages/supabase/`: `useAuth()` hook returning user, tenant, role
  - Separate Supabase client configs: `client.browser.ts` (for web, uses `@supabase/ssr`), `client.mobile.ts` (for RN, uses `@supabase/supabase-js` + AsyncStorage)
  - Role-based route protection in web app: owner/manager routes vs employee-only routes
  - Session management: auto-refresh tokens, logout, password reset
  - Create `packages/validators/src/auth.ts`: signup schema (email, password, businessName, abn), invitation schema

  **Must NOT do**:
  - Do not build kiosk/shared-device PIN mode
  - Do not build SMS-based invitations (Phase 1B consideration)
  - Do not import service role key in packages/supabase client files

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Blocks**: T4, T7, T12
  - **Blocked By**: T1, T2

  **References**:
  - Metis directive: Use `@supabase/ssr` ONLY in apps/web; use `@supabase/supabase-js` + AsyncStorage in apps/mobile
  - Metis directive: Never import SUPABASE_SERVICE_ROLE_KEY in shared packages
  - ABN Modulus 89 validation in packages/validators

  **Acceptance Criteria**:
  - [ ] Business owner can sign up at `/signup` with email, password, business name, ABN
  - [ ] After signup, redirected to `/dashboard` with tenant created in DB
  - [ ] Manager can invite employee via email from `/team` page
  - [ ] Employee receives email, clicks link, sets password, sees their dashboard
  - [ ] Invalid ABN (e.g., '12345678901') shows validation error
  - [ ] Unauthenticated user accessing `/dashboard` redirected to `/login`
  - [ ] Vitest: ABN validation passes for known valid ABNs, fails for invalid

  **QA Scenarios**:
  ```
  Scenario: Full signup-to-dashboard flow
    Tool: Playwright
    Steps:
      1. Navigate to localhost:3000/signup
      2. Fill: email=test@crewcircle.com.au, password=TestPass123!, business=TestCafe, abn=51824753556
      3. Click "Create Account"
      4. Assert URL is /dashboard
      5. Assert page contains "TestCafe"
    Expected Result: Dashboard loads with business name displayed
    Evidence: .sisyphus/evidence/task-3-signup-flow.png

  Scenario: Invalid ABN rejected
    Tool: Playwright
    Steps:
      1. Navigate to /signup
      2. Fill abn=12345678901
      3. Click "Create Account"
      4. Assert error message contains "Invalid ABN"
    Expected Result: Form shows ABN validation error, does not submit
    Evidence: .sisyphus/evidence/task-3-abn-validation.png
  ```

  **Commit**: YES
  - Message: `feat(auth): add business signup with ABN validation, employee invitation, and role-based access`
  - Pre-commit: `pnpm turbo build && pnpm turbo test`

- [x] 4. Roster Grid UI with Drag-and-Drop

  **What to do**:
  - Build roster page at `/roster` with employees × days grid (CSS Grid layout)
  - Implement drag-and-drop using `@dnd-kit/core` + `@dnd-kit/sortable` — shifts can be dragged between cells (employee×day slots)
  - Each cell = `useDroppable` target; each shift = `useDraggable` item
  - Virtualize rows with `@tanstack/react-virtual` for 50+ employee performance
  - State management with Zustand + Immer for O(1) cell updates
  - Weekly view with date navigation (previous/next week)
  - Shift cards show: employee name, start-end time, role label, duration
  - Add shift button per cell (click empty cell → shift creation modal)
  - Shift creation modal: select employee, start time, end time, role label, notes
  - Keyboard accessibility: all drag operations have keyboard-only alternative via dnd-kit KeyboardSensor + edit dialog fallback (WCAG 2.5.7)
  - Auto-save draft roster to Supabase (debounced, every 5 seconds of changes)
  - Loading skeleton while roster data fetches
  - Responsive layout: works on desktop (1024px+), warning on mobile to use app

  **Must NOT do**:
  - Do not build auto-scheduling or AI suggestions
  - Do not build recurring/repeating shift templates
  - Do not add award-based cost calculations to shifts

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Blocks**: T5, T6, T8
  - **Blocked By**: T2, T3

  **References**:
  - Metis research: dnd-kit is the clear winner (6KB, multi-container, keyboard accessible)
  - Metis research: CSS Grid with employees × days matrix, each cell is useDroppable target
  - Metis directive: @tanstack/react-virtual for row virtualization, Zustand + Immer for O(1) updates
  - Metis directive: WCAG 2.5.7 compliance — keyboard alternative for all drag operations

  **Acceptance Criteria**:
  - [ ] `/roster` page renders a 7-day grid with employee rows
  - [ ] Shifts can be dragged from one cell to another (employee/day reassignment)
  - [ ] Add shift modal: select employee, times, role → shift appears in grid
  - [ ] Grid renders 30 employees × 7 days in <2 seconds
  - [ ] Keyboard: Tab to shift, Enter to edit, arrow keys to move between cells
  - [ ] Draft auto-saved (verify Supabase has latest data after 5s delay)

  **QA Scenarios**:
  ```
  Scenario: Drag shift from Monday to Tuesday
    Tool: Playwright
    Steps:
      1. Navigate to /roster, select current week
      2. Create shift for Employee A on Monday 9am-5pm
      3. Drag shift card from Monday column to Tuesday column
      4. Assert shift now appears in Tuesday column, not Monday
      5. Refresh page — assert shift persists in Tuesday (auto-saved)
    Expected Result: Shift moved and persisted
    Evidence: .sisyphus/evidence/task-4-drag-shift.png

  Scenario: Performance with 30 employees
    Tool: Playwright
    Steps:
      1. Seed 30 employees + 60 shifts via Supabase
      2. Navigate to /roster
      3. Measure time from navigation to grid fully rendered (waitForSelector('.roster-grid'))
      4. Assert render time < 2000ms
    Expected Result: Grid loads in under 2 seconds
    Evidence: .sisyphus/evidence/task-4-performance.txt
  ```

  **Commit**: YES
  - Message: `feat(roster): add drag-and-drop roster grid with dnd-kit, virtual rows, and keyboard accessibility`

- [x] 5. Shift CRUD + Conflict Detection + Validation

  **What to do**:
  - Create/Read/Update/Delete shifts via Supabase with RLS enforcement
  - Shift validation in `packages/validators/src/shift.ts`: start < end, duration ≤ 16 hours, no zero-length shifts
  - Midnight-crossing shift handling: store as UTC timestamptz (shift 10pm-6am spans two calendar days; display on starting day)
  - Conflict detection function `detectConflicts()` in `packages/validators/`:
    - OVERLAP: new shift overlaps existing shift for same employee
    - AVAILABILITY: shift is during employee's unavailable time
    - MAX_HOURS: employee exceeds configurable weekly max hours (default 38 for AU)
    - MIN_REST: less than 10 hours between consecutive shifts
  - Conflict detection runs: live during drag (visual preview with red highlight) and on save (enforce/warn)
  - Conflicts shown as warnings (soft mode) — manager can override with acknowledgment
  - Vitest tests for conflict detection with specific time data covering: overlap, availability violation, max hours exceeded, min rest violated, midnight-crossing, DST transition

  **Must NOT do**:
  - Do not calculate pay rates, penalty rates, or overtime costs
  - Do not enforce conflicts as hard blocks (soft warnings only in Phase 1A)

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Blocks**: T6, T9, T11
  - **Blocked By**: T4

  **References**:
  - Metis: Conflict detection must run in two places — live during drag (visual preview) and on drop (enforce rules)
  - Metis: Midnight-crossing shifts display on starting day in roster grid
  - Metis: DST transition edge case — store UTC, display wall-clock times
  - AU context: 38 ordinary hours per week under most Modern Awards

  **Acceptance Criteria**:
  - [ ] Create shift via modal → shift appears in grid and persists in DB
  - [ ] Edit shift (change times/employee) → changes reflected immediately
  - [ ] Delete shift → soft delete (deleted_at set, shift disappears from grid)
  - [ ] Overlap conflict: shift A 09:00-17:00, shift B 15:00-23:00 → OVERLAP warning shown
  - [ ] Availability conflict: employee unavailable Monday, shift created Monday → warning shown
  - [ ] Midnight-crossing: shift 22:00-06:00 → displays on starting day, hours calculated correctly (8 hours)
  - [ ] Vitest: `pnpm --filter validators test` passes all conflict detection tests

  **QA Scenarios**:
  ```
  Scenario: Overlap conflict detected
    Tool: Playwright
    Steps:
      1. Create shift for Employee A: Monday 9am-5pm
      2. Create another shift for Employee A: Monday 3pm-11pm
      3. Assert warning banner appears with text containing "overlap"
    Expected Result: Orange warning banner shows overlap conflict
    Evidence: .sisyphus/evidence/task-5-overlap-conflict.png

  Scenario: Midnight-crossing shift calculates hours correctly
    Tool: Vitest
    Steps:
      1. Create shift: start=2026-04-06T22:00:00+11:00, end=2026-04-07T06:00:00+11:00
      2. Call calculateShiftDuration(shift)
      3. Assert result = 8 hours
    Expected Result: Duration is 8.0 hours (not -16 or 0)
    Evidence: .sisyphus/evidence/task-5-midnight-crossing.txt
  ```

  **Commit**: YES
  - Message: `feat(roster): add shift CRUD with conflict detection, midnight-crossing support, and validation`

- [x] 6. Roster Publish Workflow + Realtime Updates

  **What to do**:
  - Roster state machine: draft → published → archived (stored in `rosters.status`)
  - Publish button on roster page → confirms with manager → sets status=published, published_at, published_by
  - Published roster is read-only (cannot edit shifts; must create new draft or unpublish)
  - Unpublish flow: manager can revert to draft (with confirmation)
  - Copy-forward: "Copy from last week" button creates new draft roster with same shifts (adjusted dates)
  - Supabase Realtime subscription on `rosters` and `shifts` tables — when roster is published, all connected clients see updated status immediately
  - Supabase Edge Function `on-roster-published`: triggered by roster status change → queues push notifications for all affected employees (implemented in T10)
  - Create `packages/ui-shared/hooks/useRosterRealtime.ts` — subscribes to roster/shift changes for live updates

  **Must NOT do**:
  - Do not build recurring/repeating templates (copy-forward is sufficient)
  - Do not build approval workflow (draft → published is sufficient for Phase 1A)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Blocks**: T10, T8
  - **Blocked By**: T5

  **Acceptance Criteria**:
  - [ ] Publish button sets roster status to 'published' and shows timestamp
  - [ ] Published roster: shift edit buttons disabled, "Read Only" badge shown
  - [ ] Copy-forward: clicking "Copy from last week" creates new draft with same shift structure, dates +7
  - [ ] Realtime: open 2 browser tabs, publish in tab A → tab B shows "Published" status within 2 seconds
  - [ ] Edge function `on-roster-published` fires on publish (check Supabase logs)

  **QA Scenarios**:
  ```
  Scenario: Publish makes roster read-only
    Tool: Playwright
    Steps:
      1. Create roster with 3 shifts, status = draft
      2. Click "Publish Roster" → confirm dialog
      3. Assert roster status badge shows "Published"
      4. Assert shift edit buttons are disabled / not visible
      5. Click "Unpublish" → assert shifts are editable again
    Expected Result: Published roster is read-only; unpublish restores editing
    Evidence: .sisyphus/evidence/task-6-publish-readonly.png

  Scenario: Copy-forward creates correct dates
    Tool: Playwright
    Steps:
      1. View roster for week of March 23 with shifts on Mon/Wed/Fri
      2. Navigate to week of March 30
      3. Click "Copy from last week"
      4. Assert shifts appear on Mon Mar 30, Wed Apr 1, Fri Apr 3
    Expected Result: Shifts copied with dates exactly +7 days
    Evidence: .sisyphus/evidence/task-6-copy-forward.png
  ```

  **Commit**: YES
  - Message: `feat(roster): add publish workflow with state machine, copy-forward, and realtime updates`

- [x] 7. Mobile App Shell + Auth

  **What to do**:
  - Set up Expo Router (file-based routing): `(auth)/login`, `(auth)/accept-invite`, `(tabs)/roster`, `(tabs)/timeclock`, `(tabs)/messages`, `(tabs)/profile`
  - Supabase auth integration using `@supabase/supabase-js` + `@react-native-async-storage/async-storage` (NOT @supabase/ssr)
  - Login screen: email + password → authenticate → redirect to tabs
  - Accept invitation screen: deep link from email → set password → join tenant
  - Tab navigation: Roster, Time Clock, Messages, Profile
  - Profile screen: view name, role, tenant; logout button
  - Expo Push Notification token registration: on first login, register device token with Supabase (store in `push_tokens` table)
  - App icon, splash screen with CrewCircle branding
  - Configure `eas.json` for iOS and Android builds

  **Must NOT do**:
  - Do not build the feature screens yet (just navigation shells with placeholder text)
  - Do not use `@supabase/ssr` in mobile app

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Blocks**: T8, T9
  - **Blocked By**: T2, T3

  **Acceptance Criteria**:
  - [ ] `pnpm --filter mobile start` launches Expo dev server
  - [ ] Login screen accepts email/password and authenticates against Supabase
  - [ ] After login, tab bar shows: Roster, Time Clock, Messages, Profile
  - [ ] Profile tab shows user name, role, business name; logout works
  - [ ] Push notification permission requested on first launch; token stored in DB
  - [ ] `eas build --platform ios --profile preview` produces IPA
  - [ ] `eas build --platform android --profile preview` produces APK

  **QA Scenarios**:
  ```
  Scenario: Employee login on mobile
    Tool: Manual (Expo Go)
    Steps:
      1. Open app in Expo Go on physical device
      2. Enter employee email/password (created via web invitation)
      3. Tap "Log In"
      4. Assert tab bar appears with Roster, Time Clock, Messages, Profile
      5. Tap Profile → assert shows employee name and business name
    Expected Result: Employee successfully logs in and sees navigation
    Evidence: .sisyphus/evidence/task-7-mobile-login.png
  ```

  **Commit**: YES
  - Message: `feat(mobile): add Expo app shell with Supabase auth, tab navigation, and push token registration`

- [x] 8. Employee Roster View + Availability Management (Mobile)

  **What to do**:
  - Roster tab: fetch published roster for current week from Supabase (filtered to logged-in employee's shifts)
  - Display shifts as cards: date, start-end time, role, location name, notes
  - Weekly calendar strip at top for date navigation
  - "Today" indicator and "next shift" highlight
  - Supabase Realtime subscription: when roster is updated/published, employee sees changes instantly
  - Availability screen (accessible from Profile or Roster tab):
    - 7-day grid (Mon-Sun) with time slots
    - Employee taps to set available/unavailable per day + time range
    - Saves to `availability` table in Supabase
    - Manager sees availability in web roster grid (background color coding)
  - Pull-to-refresh on roster list
  - Empty state: "No shifts scheduled this week" with illustration

  **Must NOT do**:
  - Do not build shift swap or open shift claiming (Phase 1B)
  - Do not build partial-day availability with multiple ranges per day (one range per day is sufficient)
  - Do not build "prefer not to work" soft constraints (binary available/unavailable only)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Blocks**: T9
  - **Blocked By**: T7, T6

  **Acceptance Criteria**:
  - [ ] Employee opens Roster tab → sees their shifts for current week
  - [ ] Each shift card shows: day, time range, role, duration
  - [ ] Navigating to next week shows next week's shifts (or empty state)
  - [ ] Availability: employee sets "Unavailable" on Tuesday → saved to DB → manager sees on web roster grid
  - [ ] Realtime: manager publishes new roster → employee's app updates within 3 seconds without manual refresh

  **QA Scenarios**:
  ```
  Scenario: Employee sees published shifts
    Tool: Manual (Expo Go)
    Steps:
      1. On web: create roster with 3 shifts for test employee, publish
      2. On mobile: open app as test employee, go to Roster tab
      3. Assert 3 shift cards visible with correct times
      4. Navigate to next week → assert "No shifts scheduled"
    Expected Result: Only current week's published shifts shown
    Evidence: .sisyphus/evidence/task-8-employee-roster.png

  Scenario: Availability saved and visible to manager
    Tool: Manual (Expo Go) + Playwright
    Steps:
      1. On mobile: tap Availability, mark Tuesday as Unavailable (all day)
      2. On web (/roster): view roster grid for that employee
      3. Assert Tuesday cell has unavailable indicator (red/grey background)
    Expected Result: Availability synced from mobile to web
    Evidence: .sisyphus/evidence/task-8-availability-sync.png
  ```

  **Commit**: YES
  - Message: `feat(mobile): add employee roster view with realtime updates and availability management`

- [x] 9. Time Clock with GPS + Geofencing + Offline Support

  **What to do**:
  - Time Clock tab on mobile: large "Clock In" / "Clock Out" button with current status
  - On clock-in: capture GPS coordinates using `react-native-geolocation-service` (one-shot high-accuracy fix)
  - Compare GPS to employee's assigned location geofence (latitude, longitude, radius from `locations` table)
  - Soft-mode geofencing: if outside geofence, show warning "You appear to be outside [Location Name]. Clock in anyway?" — allow with flag `is_within_geofence=false`
  - Store clock event in Supabase `clock_events` table with idempotency_key
  - Offline support: if no network, store clock event in SQLite (`expo-sqlite`) outbox table with idempotency_key; sync to Supabase when connectivity restored; show "Offline — will sync" indicator
  - Display current shift info on Time Clock screen (if employee has a shift today)
  - Show clock-in duration timer while clocked in
  - Auto clock-out after 23 hours (with flag for manual review)
  - Anti-spoofing: use `react-native-turbo-mock-location-detector` to detect mock GPS; warn but don't block
  - Vitest tests for geofence distance calculation (haversine formula)

  **Must NOT do**:
  - Do not implement hard-block geofencing (soft mode only — warn, don't prevent)
  - Do not implement break tracking or break deduction
  - Do not implement photo verification at clock-in (Phase 1B)
  - Do not use continuous background location tracking

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: []

  **Parallelization**:
  - **Blocks**: T11
  - **Blocked By**: T7, T5

  **References**:
  - Metis research: `react-native-background-geolocation` for geofence-only mode; `react-native-geolocation-service` for one-shot fix
  - Metis research: Offline clock-in with SQLite outbox + idempotency keys (NOT AsyncStorage)
  - Metis directive: Soft-mode geofencing only in Phase 1A
  - Metis research: Deputy uses 100m minimum, 150m+ recommended for urban
  - Metis risk: NSW requires 14 days written notice before GPS tracking — add compliance notice in onboarding

  **Acceptance Criteria**:
  - [ ] Employee taps "Clock In" → GPS captured → clock event stored in Supabase with coordinates
  - [ ] If within geofence (150m of location): green indicator "Clocked in at [Location]"
  - [ ] If outside geofence: orange warning with "Clock in anyway?" option; `is_within_geofence=false` stored
  - [ ] Offline: disable WiFi → clock in → "Offline — will sync" shown → re-enable WiFi → event syncs within 30s → Supabase has matching row
  - [ ] Duration timer counts up while clocked in
  - [ ] Auto clock-out at 23 hours: clock event with `type=clock_out` and `source=auto` inserted
  - [ ] Vitest: haversine distance(-33.8688, 151.2093, -33.8695, 151.2100) < 150m → true (within geofence)

  **QA Scenarios**:
  ```
  Scenario: Clock in within geofence
    Tool: Manual (Expo Go on physical device in Melbourne)
    Steps:
      1. Set location geofence to current physical location with 150m radius
      2. Tap "Clock In"
      3. Assert green "Clocked in at [Location]" message
      4. Assert duration timer counting
      5. Check Supabase clock_events table: row exists with is_within_geofence=true
    Expected Result: Clock-in recorded with GPS within geofence
    Evidence: .sisyphus/evidence/task-9-clock-in-geofence.png

  Scenario: Offline clock-in syncs on reconnect
    Tool: Manual (Expo Go)
    Steps:
      1. Enable airplane mode on device
      2. Tap "Clock In" → assert "Offline — will sync" indicator
      3. Check SQLite: 1 row in outbox table
      4. Disable airplane mode → wait 30 seconds
      5. Check Supabase: matching clock_event row exists
      6. Check SQLite: outbox table empty (synced and cleared)
    Expected Result: Offline event synced to server
    Evidence: .sisyphus/evidence/task-9-offline-sync.txt
  ```

  **Commit**: YES
  - Message: `feat(timeclock): add GPS clock-in with soft geofencing, offline SQLite outbox, and anti-spoofing`

- [x] 10. Push Notification System

  **What to do**:
  - Supabase Edge Function `send-push-notification`: accepts payload (token, title, body, data) → calls Expo Push API
  - Database trigger or Edge Function `on-roster-published`: when roster status changes to 'published', fetch all affected employees' push tokens → send notification "Your roster for [week] has been published"
  - Shift reminder Edge Function: scheduled (Supabase Cron via pg_cron) — runs every 15 minutes, finds shifts starting in next 2 hours that haven't been reminded → send reminder "Your shift starts at [time] at [location]"
  - Push token management: `push_tokens` table (profile_id, expo_push_token, platform, created_at); on mobile app login, register token; on logout, remove token
  - Handle Expo push receipts: check for errors (InvalidToken → remove from DB)
  - Notification preferences: for Phase 1A, all notifications ON by default (no granular settings)

  **Must NOT do**:
  - Do not send SMS notifications
  - Do not send message notifications (Phase 1B)
  - Do not build in-app notification center (push only for now)
  - Do not build granular notification preferences

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Blocks**: T14
  - **Blocked By**: T6, T7

  **Acceptance Criteria**:
  - [x] Publishing roster → all affected employees receive push notification within 30 seconds
  - [x] Shift reminder: employee with shift in 2 hours receives reminder push
  - [x] Invalid push token: token removed from DB, no error thrown
  - [x] Expo Push API called correctly (verify via Edge Function logs)

  **QA Scenarios**:
  ```
  Scenario: Roster publish triggers push notifications
    Tool: Manual (Expo Go on physical device)
    Steps:
      1. Employee logged in on mobile with push permissions granted
      2. Manager publishes roster via web dashboard
      3. Within 30 seconds, push notification appears on employee device
      4. Notification title contains "Roster Published"
    Expected Result: Push received within 30s of publish
    Evidence: .sisyphus/evidence/task-10-push-roster.png
  ```

  **Commit**: YES
  - Message: `feat(notifications): add push notification system via Expo Push + Supabase Edge Functions for roster publish and shift reminders`

- [x] 11. Timesheet Generation + CSV Export

  **What to do**:
  - Timesheets page at `/timesheets`: select date range (week/fortnight/custom)
  - Auto-generate timesheets from `clock_events`: pair clock_in/clock_out events per employee per day → calculate gross hours (clock-out minus clock-in)
  - Display timesheet table: Employee Name, Date, Clock In, Clock Out, Gross Hours, Location, Geofence Status (in/out)
  - Handle edge cases: missing clock-out (show "Still clocked in" or auto-close at 23hrs), multiple clock-in/out pairs per day
  - Manager approval workflow: "Approve" button per row or "Approve All" — sets `approved_at`, `approved_by`
  - CSV export button: downloads CSV with columns: Employee Name, Employee Email, Date, Start Time, End Time, Hours, Location, Approved (Yes/No)
  - CSV uses Australian date format (DD/MM/YYYY) and 24-hour time
  - Filter by: employee, location, date range, approved/unapproved

  **Must NOT do**:
  - Do not calculate pay rates, overtime, or penalty rates
  - Do not build Xero/MYOB-specific export format (Phase 2)
  - Do not deduct breaks automatically (raw clock-in/out hours only)

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Blocks**: T14
  - **Blocked By**: T9

  **Acceptance Criteria**:
  - [x] `/timesheets` shows all clock events for selected date range grouped by employee
  - [x] Hours calculated correctly: clock-in 09:00, clock-out 17:00 → 8.00 hours
  - [x] Midnight-crossing: clock-in 22:00, clock-out 06:00 → 8.00 hours
  - [x] Approve All → all rows marked approved with manager's name and timestamp
  - [x] CSV download: file contains correct columns, AU date format (DD/MM/YYYY), 24-hour times
  - [x] Missing clock-out flagged with "Open" status in hours column

  **QA Scenarios**:
  ```
  Scenario: CSV export with correct format
    Tool: Playwright
    Steps:
      1. Seed 3 employees with clock events for the week
      2. Navigate to /timesheets, select current week
      3. Click "Approve All" then "Export CSV"
      4. Open downloaded CSV
      5. Assert header row: Employee Name,Email,Date,Start,End,Hours,Location,Approved
      6. Assert date format is DD/MM/YYYY
      7. Assert hours are decimal (8.00, not 8:00)
    Expected Result: Valid CSV with AU formatting
    Evidence: .sisyphus/evidence/task-11-csv-export.csv
  ```

  **Commit**: YES
  - Message: `feat(timesheets): add timesheet generation from clock events, approval workflow, and CSV export`

- [x] 12. Stripe AU Billing + Free/Paid Tier Enforcement

  **What to do**:
  - Stripe AU account setup with AUD pricing
  - Subscription product: "CrewCircle Starter" at $4 AUD/active employee/month + GST
  - Pricing page in settings: show current plan, employee count, estimated monthly cost
  - Free tier enforcement: if tenant has ≤5 active (non-deleted) employees, all features work; at employee #6, show upgrade prompt blocking further employee additions
  - Upgrade flow: settings → billing → enter card (Stripe Elements) → create subscription → unlock unlimited employees
  - Supabase Edge Function `stripe-webhook`: handle `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted` events → update tenant plan status in DB
  - Metered billing: on each billing cycle, count active employees → report usage to Stripe
  - Cancel flow: settings → billing → cancel subscription → downgrade to free tier (employees beyond 5 become read-only, not deleted)
  - Show "$X + GST" pricing (Australian convention)
  - BECS Direct Debit as alternative payment method (via Stripe)

  **Must NOT do**:
  - Do not build annual billing option in Phase 1A
  - Do not build multiple pricing tiers (just free + starter)
  - Do not process any payroll or handle employee wages

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: []

  **Parallelization**:
  - **Blocks**: T14
  - **Blocked By**: T3

  **Acceptance Criteria**:
  - [x] Tenant with ≤5 employees: all features work, no upgrade prompts
  - [x] Tenant adds 6th employee: upgrade prompt shown, cannot proceed without subscribing
  - [x] Upgrade: enter card → Stripe subscription created → 6th employee addition succeeds
  - [x] Stripe webhook updates tenant plan in DB on successful payment
  - [x] Cancel: subscription cancelled → tenant reverts to free tier → extra employees become read-only
  - [x] Pricing displayed as "$4 + GST per employee per month"

  **QA Scenarios**:
  ```
  Scenario: Free tier enforced at 6th employee
    Tool: Playwright
    Steps:
      1. Sign up new business (free tier)
      2. Add employees 1 through 5 — all succeed
      3. Attempt to add employee 6
      4. Assert upgrade modal appears with pricing "$4 + GST per employee per month"
      5. Assert employee 6 is NOT created in DB
    Expected Result: Free tier blocks at 6th employee with clear upgrade CTA
    Evidence: .sisyphus/evidence/task-12-free-tier-limit.png
  ```

  **Commit**: YES
  - Message: `feat(billing): add Stripe AU subscription with metered per-employee billing and free tier enforcement`

- [x] 13. Landing Page + Privacy Policy + Terms

  **What to do**:
  - Marketing landing page at `/` (root route): hero section, feature highlights (rostering, time clock, messaging), pricing section, CTA to signup
  - Mobile-responsive design
  - SEO: meta tags, Open Graph, structured data for "employee scheduling software Australia"
  - Privacy policy at `/privacy`: covers Australian Privacy Principles, data stored in AU, 7-year retention policy, employee rights
  - Terms of service at `/terms`: subscription terms, data ownership, service SLA
  - Include: "Data hosted in Australia (AWS Sydney)" trust badge
  - Include: ABN and business registration details in footer
  - Simple analytics (Plausible or Umami — privacy-friendly, no cookie banner needed)

  **Must NOT do**:
  - Do not build a blog (Phase 2 for SEO)
  - Do not build elaborate marketing automation
  - Do not use Google Analytics (requires cookie consent in AU context)

  **Recommended Agent Profile**:
  - **Category**: `visual-engineering`
  - **Skills**: []

  **Parallelization**:
  - **Blocks**: T14
  - **Blocked By**: None (can run independently but scheduled here for flow)

  **Acceptance Criteria**:
  - [x] Landing page loads at `/` with hero, features, pricing, signup CTA
  - [x] Mobile responsive (works on 375px width)
  - [x] `/privacy` contains Privacy Act references, APPs compliance, data residency statement
  - [x] `/terms` contains subscription terms, cancellation policy
  - [x] Lighthouse: Performance >90, Accessibility >90, SEO >90

  **QA Scenarios**:
  ```
  Scenario: Landing page SEO and performance
    Tool: Playwright
    Steps:
      1. Navigate to localhost:3000/
      2. Assert page title contains "CrewCircle" and "rostering"
      3. Assert meta description contains "Australian" and "scheduling"
      4. Assert signup CTA button visible and links to /signup
      5. Run Lighthouse audit: assert Performance >90, SEO >90
    Expected Result: Landing page is fast, SEO-ready, with clear CTA
    Evidence: .sisyphus/evidence/task-13-landing-lighthouse.json
  ```

  **Commit**: YES
  - Message: `feat(landing): add marketing landing page with pricing, privacy policy, and terms of service`

- [ ] 14. Deploy Web + Submit Mobile Apps

  **What to do**:
  - Deploy Next.js web app to Vercel (connect GitHub repo, set environment variables, configure custom domain crewcircle.com.au)
  - Set Vercel region to Sydney (syd1) for low latency
  - Configure Supabase project: ensure production environment, set up database backups
  - iOS build: `eas build --platform ios --profile production` → submit to App Store Connect → fill metadata (screenshots, description, privacy nutrition labels) → submit for review
  - Android build: `eas build --platform android --profile production` → upload to Google Play Console → fill store listing → submit for review
  - Set up monitoring: Vercel analytics + Supabase dashboard for DB metrics
  - Set up error tracking: Sentry (free tier) for both web and mobile
  - Configure custom domain email (support@crewcircle.com.au) for App Store contact
  - DNS: crewcircle.com.au → Vercel, configure SSL
  - Smoke test production deployment end-to-end

  **Must NOT do**:
  - Do not set up complex CI/CD pipeline beyond GitHub Actions build check
  - Do not set up staging environment (production-only for MVP)

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: []

  **Parallelization**:
  - **Blocked By**: T10, T11, T12, T13 (all features must be complete)

  **Acceptance Criteria**:
  - [ ] crewcircle.com.au loads landing page over HTTPS
  - [ ] /signup, /login, /dashboard all work in production
  - [ ] iOS app submitted to App Store (status: Waiting for Review or approved)
  - [ ] Android app submitted to Google Play (status: In Review or approved)
  - [ ] Sentry captures errors from production
  - [ ] Full smoke test: signup → add employee → build roster → publish → employee login on mobile → clock in → export CSV — all work in production

  **QA Scenarios**:
  ```
  Scenario: Production end-to-end smoke test
    Tool: Playwright + Manual (mobile device)
    Steps:
      1. Navigate to crewcircle.com.au/signup
      2. Create business account
      3. Add 3 employees, invite via email
      4. Build roster, publish
      5. On mobile device: employee accepts invite, logs in, views roster, clocks in
      6. On web: view timesheets, export CSV
    Expected Result: Full flow works in production
    Evidence: .sisyphus/evidence/task-14-production-smoke.txt
  ```

  **Commit**: YES
  - Message: `chore(deploy): deploy web to Vercel Sydney, submit iOS and Android builds, configure monitoring`

---

## Final Verification Wave

> After ALL implementation tasks complete. Present consolidated results to user and get explicit "okay" before completing.

- [ ] F1. **Plan Compliance Audit** — `deep`
  Read the plan end-to-end. For each "Must Have": verify implementation exists. For each "Must NOT Have": search codebase for forbidden patterns. Check evidence files exist. Compare deliverables against plan.
  Output: `Must Have [N/N] | Must NOT Have [N/N] | VERDICT`

- [ ] F2. **Code Quality Review** — `unspecified-high`
  Run `pnpm turbo build` + `pnpm turbo lint` + `supabase test db` + `pnpm turbo test`. Review all files for: `as any`, empty catches, console.log in prod, unused imports, hardcoded secrets. Check: no `SUPABASE_SERVICE_ROLE_KEY` in shared packages, no hard deletes, all timestamps use timestamptz.
  Output: `Build [PASS/FAIL] | RLS Tests [N/N] | Lint [PASS/FAIL] | VERDICT`

- [ ] F3. **End-to-End QA** — `unspecified-high` + `playwright` skill
  Start from clean state. Full user journey: Sign up business → Add employees → Build roster → Publish → Employee opens mobile app → Views shifts → Sets availability → Clocks in → Clocks out → Manager views timesheet → Exports CSV → Upgrades to paid plan. Test edge cases: midnight-crossing shift, employee outside geofence, 30+ employees roster grid performance.
  Output: `Scenarios [N/N pass] | Edge Cases [N tested] | VERDICT`

- [ ] F4. **Security Audit** — `deep`
  Test RLS isolation: create 2 tenants, verify tenant A cannot see tenant B data across all tables. Verify no service role key in client bundles. Verify soft delete works (no hard deletes). Verify auth flows (can't access without login, can't escalate roles).
  Output: `RLS [N/N isolated] | Secrets [CLEAN] | Auth [PASS] | VERDICT`

---

## Commit Strategy

| Task | Commit Message | Files |
|---|---|---|
| T1 | `chore(infra): initialize turborepo monorepo with Next.js, Expo, and Supabase` | All config files |
| T2 | `chore(db): add core schema with tenants, locations, employees, shifts, rosters` | supabase/migrations/*.sql |
| T2 | `test(db): add pgTap RLS isolation tests for all tables` | supabase/tests/*.sql |
| T3 | `feat(auth): add business signup, employee invitation, and role-based access` | apps/web/*, packages/* |
| T4 | `feat(roster): add drag-and-drop roster grid with dnd-kit and virtual rows` | apps/web/src/features/roster/* |
| T5 | `feat(roster): add shift CRUD with conflict detection and validation` | apps/web/*, packages/validators/* |
| T6 | `feat(roster): add publish workflow with state machine and realtime updates` | apps/web/*, supabase/functions/* |
| T7 | `feat(mobile): add Expo app shell with Supabase auth and navigation` | apps/mobile/* |
| T8 | `feat(mobile): add employee roster view and availability management` | apps/mobile/src/screens/* |
| T9 | `feat(timeclock): add GPS clock-in with geofencing and offline SQLite outbox` | apps/mobile/src/features/timeclock/* |
| T10 | `feat(notifications): add push notification system via Expo Push + Edge Functions` | supabase/functions/*, apps/mobile/* |
| T11 | `feat(timesheets): add timesheet generation from clock events and CSV export` | apps/web/src/features/timesheets/* |
| T12 | `feat(billing): add Stripe AU subscription with free/paid tier enforcement` | apps/web/*, supabase/functions/* |
| T13 | `feat(landing): add marketing landing page with pricing and signup CTA` | apps/web/src/app/(marketing)/* |
| T14 | `chore(deploy): deploy web to Vercel, submit iOS/Android builds` | CI/CD configs |

---

## Success Criteria

### Verification Commands
```bash
pnpm turbo build          # Expected: all packages + apps build successfully
pnpm turbo lint           # Expected: 0 errors
pnpm turbo test           # Expected: all Vitest tests pass
supabase test db          # Expected: all pgTap RLS tests pass
```

### Final Checklist
- [ ] Manager can sign up with ABN, add 10 employees, build roster, publish
- [ ] Employees receive push notification and see shifts in mobile app
- [ ] Employees can set weekly availability
- [ ] Employees can clock in/out with GPS (soft geofencing)
- [ ] Manager can view timesheets and export CSV
- [ ] Free tier enforced at ≤5 employees; upgrade prompt shown
- [ ] Paid tier charges $4/emp/mo AUD via Stripe
- [ ] All data in Supabase (AWS Sydney region)
- [ ] RLS isolates tenant data (pgTap verified)
- [ ] No hard deletes on employee/time/roster tables
- [ ] All timestamps stored as UTC timestamptz
- [ ] Privacy policy and terms of service published
- [ ] iOS and Android apps submitted to stores
