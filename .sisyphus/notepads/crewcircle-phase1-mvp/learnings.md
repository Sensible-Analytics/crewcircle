# Learnings - CrewCircle Phase 1 MVP

## Project Conventions
- Turborepo monorepo with pnpm workspaces
- Next.js 15 App Router for web
- Expo/React Native for mobile
- Supabase for backend (PostgreSQL + Auth + Realtime)
- TypeScript throughout
- Tailwind CSS for web, NativeWind for mobile

## Technical Patterns
- Multi-tenant architecture with tenant_id on all tables
- Soft delete with deleted_at columns (7-year retention)
- UTC timestamps stored as timestamptz, displayed in IANA timezone
- RLS policies using is_tenant_member() SECURITY DEFINER function
- Separate Supabase clients: @supabase/ssr for web, @supabase/supabase-js + AsyncStorage for mobile

## Completed Tasks
- Task 1: Monorepo setup with Turborepo, Next.js, Expo, Supabase
- Task 2: Database schema with all core tables, RLS policies, pgTap tests
- Task 3: Auth system with business signup, ABN validation, employee invitations
- Task 4: Roster grid UI with drag-and-drop using dnd-kit
- Task 5: Shift CRUD with conflict detection (overlap, availability, max hours, min rest)
- Task 6: Roster publish workflow with state machine, copy-forward, and realtime updates
- Task 7: Mobile app shell with Expo Router, Supabase auth, and tab navigation
- Task 8: Employee roster view and availability management on mobile

## Key Decisions
- Using dnd-kit for drag-and-drop (6KB, multi-container, keyboard accessible)
- Zustand + Immer for state management in roster grid
- @tanstack/react-virtual for row virtualization (50+ employees)
- Conflict detection runs live during drag and on save (soft warnings only)
- Midnight-crossing shifts stored as UTC, display on starting day

## Gotchas
- Metro bundler needs explicit metro.config.js for pnpm symlinks
- Never import SUPABASE_SERVICE_ROLE_KEY in shared packages
- Use auth.jwt() -> 'user_metadata' in RLS policies (use DB lookups instead)
- Soft delete only - no hard deletes on employee/time/roster tables
- All timestamps must be timestamptz (not timestamp without timezone)