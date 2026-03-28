# CrewCircle Gap Analysis: Plan vs Current Implementation

**Generated**: 2026-03-28  
**Plan Document**: `docs/crewcircle-agent-implementation-plan.md`  
**Current State**: CrewCircle production at crewcircle.co

---

## Executive Summary

The implementation has a **~45% completion rate** against the Phase 1A plan. Core auth and landing page are done, but critical features (roster grid, timesheets, mobile, billing) are missing or incomplete.

| Task | Plan | Actual | Status |
|------|------|--------|--------|
| 1 — Monorepo Setup | pnpm + turborepo + 3 apps + 3 packages | yarn + 1 app + 2 packages | ⚠️ Partial |
| 2 — Database Schema + RLS + pgTap | Supabase migrations + RLS policies | Zero SQL files; NeonDB used directly | ❌ Missing |
| 3 — Auth System | Supabase auth + server actions | Clerk auth (migrated) | ⚠️ Partial |
| 4 — Roster Grid UI + DnD | dnd-kit grid + virtual rows + accessibility | Store + service exist; UI grid MISSING | ❌ Missing |
| 5 — Shift CRUD + Conflicts | Full conflict engine + Vitest tests | Conflict detection exists + tests | ✅ ~80% |
| 6 — Publish Workflow + Realtime | Supabase Edge Function + webhook | Store methods exist; Edge Function MISSING | ⚠️ Partial |
| 7 — Mobile App Shell | Expo app with auth + tabs | `apps/mobile/` directory MISSING | ❌ Missing |
| 8 — Mobile Roster + Availability | Employee roster view + availability | NOT IMPLEMENTED | ❌ Missing |
| 9 — Time Clock + GPS | SQLite outbox + GPS clock-in | NOT IMPLEMENTED (mobile) | ❌ Missing |
| 10 — Push Notifications | Supabase Edge Functions + cron | NOT IMPLEMENTED | ❌ Missing |
| 11 — Timesheet + CSV Export | AU-formatted CSV export | MISSING | ❌ Missing |
| 12 — Stripe Billing | Free tier + webhooks | API route exists; core MISSING | ❌ Missing |
| 13 — Landing + Legal | Marketing page + privacy + terms | EXISTS ✅ | ✅ Done |
| 14 — Deploy | Vercel + Sydney + mobile builds | Vercel deployed ✅ | ⚠️ Partial |

---

## Critical Gaps by Priority

### 🔴 P0 — Blocking Production Readiness

#### 1. Database Schema (Task 2) — **ZERO SQL MIGRATIONS**

**Plan says**: Supabase with full schema in `supabase/migrations/`, RLS policies, pgTap tests.  
**Actual**: No `supabase/` directory exists. Uses NeonDB directly via `@neon` SDK. Schema must exist in NeonDB but is **not tracked in code**.

**Impact**: 
- Cannot recreate database from scratch
- RLS policies cannot be verified
- No pgTap isolation tests exist
- Multi-tenant isolation cannot be verified

**Required**: Document current NeonDB schema, write migration files, add RLS policies if NeonDB supports them, write pgTap tests.

---

#### 2. Roster Grid UI (Task 4) — **NO ROSTER GRID EXISTS**

**Plan says**: CSS Grid + dnd-kit drag-and-drop + @tanstack/react-virtual + Zustand store + 5s debounced auto-save.  
**Actual**: 
- `rosterStore.ts` exists ✅
- `shiftService.ts` exists ✅
- `apps/web/src/app/roster/page.tsx` exists
- **BUT**: No `RosterGrid.tsx` component exists anywhere in the codebase
- No DnD implementation
- No virtual row rendering
- No shift card components
- No cell components

**Impact**: The roster page exists but does not have the core scheduling UI.

**Required**: Build the complete roster grid with:
- `RosterGrid.tsx` — main grid component
- `RosterCell.tsx` — individual day cell with droppable
- `ShiftCard.tsx` — draggable shift card
- DnD context with sensors
- Keyboard accessibility
- Auto-save with 5s debounce
- Availability overlay for unavailable days

---

#### 3. Timesheet Feature (Task 11) — **COMPLETELY MISSING**

**Plan says**: Clock event pairing, AU-formatted CSV export, approval workflow.  
**Actual**: No timesheet feature exists.

**Required**: 
- `apps/web/src/app/timesheets/page.tsx` — full timesheet view
- Clock event pairing logic (pair clock_in with clock_out)
- CSV export with DD/MM/YYYY dates, decimal hours
- Approval workflow (manager approves hours)

---

#### 4. Billing/Stripe Integration (Task 12) — **NOT IMPLEMENTED**

**Plan says**: Free tier (5 employees), Stripe metered billing ($4/emp/mo + GST), webhooks.  
**Actual**: 
- `apps/web/src/app/api/checkout/route.ts` exists but likely empty/incomplete
- No Stripe integration in billing flow

**Required**:
- Free tier enforcement in invite flow
- Stripe checkout
- Webhook handler for `invoice.paid` and `subscription.deleted`
- Upgrade modal when exceeding 5 employees

---

### 🟡 P1 — Important Features

#### 5. Supabase Package (Task 1) — **NOT CREATED**

**Plan says**: `packages/supabase/src/client.browser.ts` and `client.mobile.ts`.  
**Actual**: No `packages/supabase/` directory. Uses NeonDB instead of Supabase for the database.

**Note**: This was a design decision to use NeonDB instead of Supabase. This is a valid change, but the plan should be updated to reflect this.

---

#### 6. Mobile App (Tasks 7-9) — **APPS/MOBILE DIRECTORY DOES NOT EXIST**

**Plan says**: Full Expo app with auth, roster view, availability, time clock, push notifications.  
**Actual**: `apps/mobile/` directory does not exist at all.

**Required**: Full Expo app implementation (Tasks 7, 8, 9 from the plan).

---

#### 7. Push Notification System (Task 10) — **NOT IMPLEMENTED**

**Plan says**: Supabase Edge Functions for roster published notifications, shift reminder cron.  
**Actual**: No Edge Functions exist.

---

#### 8. Roster Publish Edge Function (Task 6) — **MISSING**

**Plan says**: `supabase/functions/on-roster-published/index.ts` + Database Webhook registration.  
**Actual**: `useRosterRealtime.ts` hook exists, store has publish methods, but the Edge Function and webhook registration are missing.

---

### 🟢 P2 — Nice to Have / Future

#### 9. Expo Metro Config (Task 1.3) — **N/A** (mobile not started)

#### 10. pgTap Tests (Task 2) — **NO TESTS EXIST**

No Supabase migration files, no pgTap tests, no RLS policy verification.

---

## Architecture Changes from Plan

The current implementation made these intentional deviations from the plan:

| Plan | Actual | Reason |
|------|--------|--------|
| Supabase for database | NeonDB (PostgreSQL) | Better DX, EUC Sydney region |
| Supabase Auth | Clerk | More mature auth solution |
| pnpm | yarn | Existing project convention |
| @supabase/ssr | @neon | NeonDB SDK for serverless Postgres |

These are **reasonable decisions** but mean the plan document is out of sync with reality.

---

## Immediate Action Plan

### Phase 1 — Fix P0 Blocking Issues (1-2 days)

1. **Document NeonDB Schema** — Export current schema from NeonDB, write SQL migration files
2. **Build Roster Grid UI** — Complete Task 4: DnD grid, shift cards, cells, auto-save
3. **Implement Timesheet Feature** — Task 11: clock event pairing, CSV export
4. **Add Free Tier Enforcement** — Task 12: limit check in invite flow

### Phase 2 — Complete P1 Features (3-5 days)

5. **Build Mobile App** — Tasks 7, 8, 9: Expo app with roster, availability, time clock
6. **Push Notification System** — Task 10: Edge Functions + cron
7. **Roster Publish Webhook** — Task 6: Edge Function + webhook registration

### Phase 3 — Polish (1-2 days)

8. **Stripe Billing** — Task 12: complete integration
9. **pgTap Tests** — Task 2: RLS isolation tests
10. **Update Plan Document** — Sync with actual architecture decisions

---

## Files That Need Work

### MUST CREATE:
- `supabase/migrations/20240001_core_schema.sql` — Core database schema
- `supabase/migrations/20240002_rls_helpers.sql` — is_tenant_member function
- `supabase/migrations/20240003_rls_policies.sql` — RLS policies
- `supabase/tests/rls_isolation.test.sql` — pgTap tests
- `apps/web/src/features/roster/RosterGrid.tsx` — Main grid UI
- `apps/web/src/features/roster/RosterCell.tsx` — Day cell
- `apps/web/src/features/roster/ShiftCard.tsx` — Shift card
- `apps/web/src/app/timesheets/page.tsx` — Timesheet view
- `apps/web/src/features/timesheets/export.ts` — CSV export
- `apps/web/src/features/billing/limits.ts` — Free tier check
- `apps/web/src/app/api/webhooks/stripe/route.ts` — Stripe webhooks
- `apps/mobile/` — Full Expo app (Tasks 7-9)
- `supabase/functions/on-roster-published/index.ts` — Push notification trigger
- `supabase/functions/send-push-notification/index.ts` — Push sender
- `supabase/functions/send-shift-reminders/index.ts` — Shift reminders

### MUST FIX:
- `apps/web/src/app/roster/page.tsx` — Wire up RosterGrid
- `apps/web/src/store/rosterStore.ts` — Add moveShift with DnD
- `apps/web/src/app/api/checkout/route.ts` — Implement Stripe checkout

### VERIFY:
- `apps/web/src/middleware.ts` — Clerk middleware (looks correct ✅)
- `apps/web/src/lib/neon/shiftService.ts` — Shift CRUD (looks complete ✅)
- `packages/validators/src/conflicts.ts` — Conflict detection (looks complete ✅)
- Landing page, privacy, terms pages (exist ✅)

---

## Dependencies Between Tasks

```
Task 2 (Schema) ──────┬──► Task 3 (Auth) ──► Task 4 (Roster Grid)
                      │                         │
                      └──► Task 5 (Conflicts) ──►│
                                                  │
Task 6 (Realtime) ───► Task 7 (Mobile) ─────────►│
                      │                         │
Task 10 (Push) ───────┴──► Task 8 (Mobile Roster)│
                                                  │
Task 9 (Time Clock) ─────────────────────────────►│
                                                  │
                                                  ▼
                        Task 11 (Timesheets) ◄────┘
                        Task 12 (Billing) ◄────────┘
```

---

## Effort Estimate

| Phase | Tasks | Estimated Effort |
|-------|-------|-----------------|
| Phase 1 | 2, 4, 11, 12 | 3-5 days |
| Phase 2 | 7, 8, 9, 10, 6 | 5-7 days |
| Phase 3 | 12 (Stripe), 2 (pgTap), docs | 1-2 days |
| **Total** | **All 14 tasks** | **~10-14 days** |
