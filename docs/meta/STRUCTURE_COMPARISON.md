# CrewCircle: Original vs New Structure Comparison Report

## Executive Summary

During the deployment task, a parallel app structure was created at `apps/web/app/` (without `src/`), causing confusion. This report documents the differences and provides a merge plan.

---

## Current State

### Original Structure (Intact)

- **Location**: `apps/web/src/app/`
- **Pages**: 15+ pages (login, signup, roster, timesheets, settings, etc.)
- **Features**: Full-featured roster grid, timesheets, demo mode, billing
- **Dependencies**: `@clerk/nextjs`, `@neondatabase/serverless`, Stripe, Clerk auth
- **Middleware**: Uses Clerk for auth protection

### New Structure (Created During Task)

- **Location**: `apps/web/app/` (parallel, no `src/`)
- **Pages**: 5 pages (landing, login, signup, roster, privacy, terms)
- **Features**: Basic landing page, roster page with week navigation
- **Dependencies**: None added (local validators)
- **Middleware**: Supabase-based auth bypass for E2E tests

---

## File Structure Comparison

### Original (`apps/web/src/app/`)

```
src/app/
├── api/           (checkout, webhooks, timesheets, invite)
├── auth/          (callback handling)
├── blog/          (fair-work-act content)
├── demo/          (demo mode pages)
├── forgot-password/
├── login/
├── privacy/
├── roster/
├── settings/      (billing)
├── signup/
├── terms/
├── timesheets/
├── update-password/
├── layout.tsx    (Clerk provider, layout with fonts)
├── page.tsx      (full landing page with pricing)
└── globals.css
```

### New (`apps/web/app/`)

```
app/              (NEW - parallel structure)
├── (auth)/       (route group)
│   └── signup/
├── (dashboard)/
│   └── page.tsx
├── login/         (NEW)
├── privacy/      (NEW)
├── roster/       (NEW)
├── terms/        (NEW)
├── layout.tsx    (basic layout)
├── page.tsx      (landing page - simpler than original)
└── globals.css
```

---

## Key Differences

| Aspect               | Original                   | New                   |
| -------------------- | -------------------------- | --------------------- |
| **Auth**             | Clerk                      | Supabase (partial)    |
| **Database**         | Neon PostgreSQL            | None configured       |
| **Landing Page**     | Full-featured with pricing | Simplified            |
| **Roster**           | Full RosterGrid component  | Basic week navigation |
| **Timesheets**       | ✅ Complete                | ❌ Not implemented    |
| **Settings/Billing** | ✅ Complete                | ❌ Not implemented    |
| **Demo Mode**        | ✅ Available               | ❌ Not implemented    |
| **E2E Test Files**   | `apps/web/e2e/`            | `tests/web/`          |

---

## Untracked Files Created During Task

### New Files to Keep

- `tests/web/` - Playwright e2e tests (smoke, landing, roster, auth)
- `playwright.config.ts` - Test configuration
- `packages/validators/src/abn.ts` - ABN validation
- `packages/validators/src/index.ts` - Validator exports

### Files to Discard

- `apps/web/app/` - Entire parallel structure (replace with `src/app/`)
- `apps/web/lib/` - Local validators (use packages)
- `apps/web/middleware.ts` - Supabase middleware (use original Clerk)

---

## Merge Plan

### Phase 1: Preserve What Works

1. **Keep e2e tests**: Move `tests/web/` content to existing test structure or integrate
2. **Keep playwright config**: Update existing config with baseURL for deployed tests
3. **Keep validators**: Package validators already exist, add any missing to `packages/validators/src/`

### Phase 2: Fix Deployment

1. Add `@supabase/ssr` and `@supabase/supabase-js` to `apps/web/package.json`
2. Ensure original `src/app/` structure builds correctly
3. Configure Vercel for root-level Next.js (not `apps/web/`)
4. Set up environment variables in Vercel project settings

### Phase 3: Run Tests Against Original

1. Deploy original app to Vercel
2. Update `playwright.config.ts` baseURL to deployed URL
3. Run existing e2e tests to verify

---

## Recommended Action

**Do NOT use the new `apps/web/app/` structure.** The original `apps/web/src/app/` is the correct canonical structure with:

- More features (timesheets, billing, demo)
- Proper auth (Clerk)
- Database integration (Neon)
- Complete route coverage

**Next Steps:**

1. Run `git checkout -- apps/web/app/` to discard the parallel structure
2. Keep the modified `apps/web/package.json` (added supabase deps)
3. Test build with `cd apps/web && pnpm build`
4. Deploy from root with proper Vercel config
