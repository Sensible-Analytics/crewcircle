# Architectural Guardrails

> **Project:** CrewCircle — Australian Workforce Management Platform
> **Last Updated:** 2026-04-05
> **Status:** Active

These guardrails define the non-negotiable architectural principles, tech stack constraints, and development standards for CrewCircle. All contributors (human and AI) must adhere to them.

---

## 1. Tech Stack

### Core

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| Runtime | Node.js | >= 20.9.0 | LTS only |
| Package Manager | pnpm | 9.15.0 | Strict peer deps enforced |
| Build Tool | Turborepo | latest | Monorepo orchestration |
| Language | TypeScript | 5.x | Strict mode required |

### Web Application

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| Framework | Next.js | 16.x | App Router only |
| UI Library | React | 19.x | Server Components preferred |
| Styling | Tailwind CSS | v4 | Utility-first, no CSS-in-JS |
| State Management | Zustand | 5.x | Client-side state only |
| Virtualization | @tanstack/react-virtual | 3.x | For large lists |
| Drag & Drop | @dnd-kit | 6.x | Roster scheduling |
| Date Handling | date-fns | 4.x | Immutable date utilities |
| Immutability | Immer | 11.x | State updates |

### Mobile Application

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| Framework | React Native | latest | Expo managed workflow |
| Build | EAS (Expo Application Services) | — | OTA updates + builds |

### Backend & Data

| Component | Technology | Version | Notes |
|-----------|-----------|---------|-------|
| Database | PostgreSQL | 16+ | Via NeonDB serverless |
| ORM/Client | NeonDB client | — | Direct SQL + typed queries |
| Validation | Zod | latest | Shared in `packages/validators` |

### Third-Party Services

| Service | Purpose | Notes |
|---------|---------|-------|
| Clerk | Authentication & User Management | OAuth + email/password |
| Stripe | Payments & Subscriptions | Webhook-driven |
| Vercel | Web Hosting & CI/CD | Preview deployments |
| AWS (ap-southeast-2) | Data Residency | Sydney region for AU compliance |

### Testing

| Type | Tool | Notes |
|------|------|-------|
| Unit | Vitest | Colocated with source |
| E2E | Playwright | Critical user journeys |
| Component | — | Via Vitest + Testing Library |

---

## 2. Architecture Principles

### 2.1 Monorepo Structure

```
crewcircle/
├── apps/
│   ├── web/          # Next.js 16 web application
│   └── mobile/       # React Native (Expo)
├── packages/
│   └── validators/   # Shared Zod schemas
├── docs/             # Documentation
└── supabase/         # Database migrations & config
```

**Rules:**
- `apps/` contains deployable applications
- `packages/` contains shared, reusable code
- No cross-app imports — shared code goes in `packages/`
- Each app has its own `package.json`, `tsconfig.json`

### 2.2 Feature-Driven Organization (Web)

```
apps/web/src/
├── app/              # Next.js App Router (routes)
├── components/       # Shared UI components
├── features/         # Feature modules (self-contained)
│   ├── roster/       # Roster management
│   ├── timesheets/   # Time tracking & payroll
│   └── team/         # Employee management
├── lib/              # Infrastructure libraries
│   ├── clerk/        # Auth & user service
│   └── neon/         # Database client
└── store/            # Zustand stores
```

**Rules:**
- Features are self-contained: own components, hooks, types, utils
- Features communicate via shared stores or server actions — never direct imports
- `lib/` contains infrastructure, not business logic
- `components/` contains truly shared UI (buttons, modals, inputs)

### 2.3 Server-First Architecture

- **Default to Server Components** — client components only when interactivity is required
- **Server Actions** for mutations — no API routes unless external webhooks
- **Data fetching** at the server level — pass props down
- **Streaming** for slow data sources — use `Suspense` boundaries

### 2.4 Data Flow

```
User Action → Server Action → Database (NeonDB) → Revalidate → UI Update
```

- Zustand for **client-only** state (UI toggles, form state, drag state)
- Server state comes from the database — never duplicate in client store
- Optimistic updates via Zustand + server action reconciliation

---

## 3. Development Standards

### 3.1 TypeScript

- `strict: true` in all `tsconfig.json` files
- No `any` — use `unknown` + type guards if needed
- Prefer `interface` for object shapes, `type` for unions/intersections
- All external data validated with Zod before use

### 3.2 Naming Conventions

| Artifact | Convention | Example |
|----------|-----------|---------|
| Components | PascalCase | `RosterCalendar.tsx` |
| Hooks | camelCase, `use` prefix | `useRosterConflicts.ts` |
| Server Actions | camelCase, verb prefix | `publishRoster.ts` |
| Types/Interfaces | PascalCase | `RosterShift` |
| Constants | UPPER_SNAKE_CASE | `MAX_EMPLOYEES_FREE_TIER` |
| Files | kebab-case or PascalCase (components) | `roster-calendar.tsx` |

### 3.3 Component Rules

- Max 150 lines per component — extract if larger
- Props typed with interfaces, not inline types
- No inline styles — use Tailwind classes
- Accessibility: semantic HTML, ARIA labels, keyboard navigation

### 3.4 Database

- All migrations in `supabase/migrations/`
- Use `IF NOT EXISTS` / `IF EXISTS` for idempotent migrations
- Indexes on foreign keys and frequently queried columns
- Row Level Security (RLS) policies for multi-tenant isolation

### 3.5 Environment Variables

- Prefix client-exposed vars with `NEXT_PUBLIC_`
- Never commit `.env.local` — use `.env.example` as template
- Validate env vars at startup with Zod schema

---

## 4. Security Guardrails

- **No secrets in code** — use environment variables only
- **Clerk middleware** protects all authenticated routes
- **RLS policies** enforce tenant isolation at database level
- **Stripe webhooks** verified with signing secret
- **CSP headers** configured in Next.js
- **Rate limiting** on public endpoints

---

## 5. Performance Guardrails

- **Bundle size:** Monitor with `@next/bundle-analyzer` — alert if > 250KB initial
- **Images:** Use `next/image` with proper sizing — no raw `<img>` tags
- **Fonts:** Self-host with `next/font` — no external font requests
- **Caching:** Leverage Next.js data cache — revalidate on mutations
- **Virtualization:** Use `@tanstack/react-virtual` for lists > 50 items

---

## 6. Deployment Guardrails

- **Web:** Vercel — preview deployments on every PR
- **Mobile:** EAS Build — production builds from `main` only
- **Database:** NeonDB — migrations run before deployment
- **Environment parity:** `.env.example` must match all environments

---

## 7. Testing Guardrails

- **Unit tests** for all utility functions and hooks
- **E2E tests** for critical user journeys:
  - Sign up / Sign in
  - Create and publish roster
  - Clock in/out
  - Generate timesheet
- **Test coverage:** Minimum 70% on `features/` and `lib/`

---

## 8. Change Process

1. **New dependencies:** Must be approved — justify why existing stack can't solve it
2. **Architecture changes:** Document via ADR (see `docs/adr/`)
3. **Breaking changes:** Require PR review + migration guide
4. **Tech stack changes:** Require team consensus + proof of concept

---

## 9. Anti-Patterns (What We Don't Do)

- ❌ No CSS-in-JS (styled-components, emotion)
- ❌ No Redux, Context for state management (use Zustand)
- ❌ No API routes for internal data fetching (use Server Actions)
- ❌ No `any` types
- ❌ No direct database access from client components
- ❌ No hardcoded secrets or API keys
- ❌ No external font loading (Google Fonts CDN)
- ❌ No class-based components

---

## 10. Compliance

- **Data residency:** All data stored in AWS ap-southeast-2 (Sydney)
- **Australian Business Number (ABN):** Validated for business accounts
- **GST:** All pricing includes GST where applicable
- **Privacy:** Compliant with Australian Privacy Principles (APP)
