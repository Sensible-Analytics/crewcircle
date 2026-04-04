# CrewCircle Bridge Implementation Plan

**Bridge Gap Between**: Proposed plan vs Current implementation  
**Generated**: 2026-03-28  
**Estimated Duration**: 10-14 days (full implementation)  
**Priority**: P0 = Blocking | P1 = Important | P2 = Nice to Have

---

## How to Use This Plan

This plan bridges the gap between `docs/crewcircle-agent-implementation-plan.md` and the current state of `crewcircle.co`. Each task is:
1. **Self-contained** with preconditions, file paths, and verification steps
2. **Prioritized** based on blocking dependencies
3. **Measurable** with concrete success criteria

---

## Phase 1 — P0: Fix Blocking Issues

### Priority 1A: Document NeonDB Schema (Task 2 Bridge)

> **Why**: The database schema must be tracked in code. Without migration files, the project cannot be reproduced.

#### Preconditions
- Access to NeonDB console or `psql` to export current schema
- Current schema has these tables: `tenants`, `profiles`, `locations`, `rosters`, `shifts`, `availability`, `clock_events`, `push_tokens`, `channels`, `messages`, `tenant_members`

#### Step 1A.1 — Export current schema from NeonDB

```bash
# Connect to NeonDB and export schema
psql "postgresql://user:password@host/database?sslmode=require" \
  -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;"
```

#### Step 1A.2 — Write core migration file

Create `supabase/migrations/20240001_core_schema.sql`:

```sql
-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- CUSTOM TYPES (ensure they exist)
-- ============================================================
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('owner', 'manager', 'employee');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE roster_status AS ENUM ('draft', 'published', 'archived');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE clock_event_type AS ENUM ('clock_in', 'clock_out');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE clock_source AS ENUM ('mobile', 'kiosk', 'manual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE channel_type AS ENUM ('team', 'direct');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE plan_type AS ENUM ('free', 'starter');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- TENANTS
-- ============================================================
CREATE TABLE IF NOT EXISTS tenants (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  abn           char(11),
  timezone      text NOT NULL DEFAULT 'Australia/Melbourne',
  plan          plan_type NOT NULL DEFAULT 'free',
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

-- ABN Modulus 89 check constraint
ALTER TABLE tenants ADD CONSTRAINT tenants_abn_valid CHECK (
  abn IS NULL OR (
    length(abn) = 11 AND abn ~ '^\d{11}$' AND (
      (
        ((abn::text::int8 / 10000000000) % 10 - 1) * 10 +
        ((abn::text::int8 / 1000000000) % 10) * 1 +
        ((abn::text::int8 / 100000000) % 10) * 3 +
        ((abn::text::int8 / 10000000) % 10) * 5 +
        ((abn::text::int8 / 1000000) % 10) * 7 +
        ((abn::text::int8 / 100000) % 10) * 9 +
        ((abn::text::int8 / 10000) % 10) * 11 +
        ((abn::text::int8 / 1000) % 10) * 13 +
        ((abn::text::int8 / 100) % 10) * 15 +
        ((abn::text::int8 / 10) % 10) * 17 +
        (abn::text::int8 % 10) * 19
      ) % 89 = 0
    )
  )
);

-- ============================================================
-- LOCATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS locations (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id),
  name                text NOT NULL,
  address             text,
  latitude            double precision,
  longitude           double precision,
  geofence_radius_m   integer NOT NULL DEFAULT 150,
  timezone            text NOT NULL DEFAULT 'Australia/Melbourne',
  created_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz
);

-- ============================================================
-- PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  role        user_role NOT NULL DEFAULT 'employee',
  first_name  text,
  last_name   text,
  email       text NOT NULL,
  phone       text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  deleted_at  timestamptz
);

-- ============================================================
-- TENANT_MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS tenant_members (
  tenant_id   uuid NOT NULL REFERENCES tenants(id),
  profile_id  uuid NOT NULL REFERENCES profiles(id),
  role        user_role NOT NULL DEFAULT 'employee',
  invited_at  timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  deleted_at  timestamptz,
  PRIMARY KEY (tenant_id, profile_id)
);

-- ============================================================
-- ROSTERS
-- ============================================================
CREATE TABLE IF NOT EXISTS rosters (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id),
  location_id   uuid NOT NULL REFERENCES locations(id),
  week_start    date NOT NULL,
  status        roster_status NOT NULL DEFAULT 'draft',
  published_at  timestamptz,
  published_by  uuid REFERENCES profiles(id),
  created_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz
);

-- ============================================================
-- SHIFTS
-- ============================================================
CREATE TABLE IF NOT EXISTS shifts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id),
  location_id   uuid NOT NULL REFERENCES locations(id),
  roster_id     uuid NOT NULL REFERENCES rosters(id),
  profile_id    uuid REFERENCES profiles(id),
  start_time    timestamptz NOT NULL,
  end_time      timestamptz NOT NULL,
  role_label    text,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  deleted_at    timestamptz,
  CONSTRAINT shifts_start_before_end CHECK (start_time < end_time),
  CONSTRAINT shifts_max_duration CHECK (end_time - start_time <= interval '16 hours')
);

-- ============================================================
-- AVAILABILITY
-- ============================================================
CREATE TABLE IF NOT EXISTS availability (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id     uuid NOT NULL REFERENCES tenants(id),
  profile_id    uuid NOT NULL REFERENCES profiles(id),
  day_of_week   smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    time,
  end_time      time,
  is_available  boolean NOT NULL DEFAULT true,
  updated_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, profile_id, day_of_week)
);

-- ============================================================
-- CLOCK EVENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS clock_events (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           uuid NOT NULL REFERENCES tenants(id),
  profile_id          uuid NOT NULL REFERENCES profiles(id),
  location_id         uuid NOT NULL REFERENCES locations(id),
  shift_id            uuid REFERENCES shifts(id),
  type                clock_event_type NOT NULL,
  recorded_at         timestamptz NOT NULL DEFAULT now(),
  latitude            double precision,
  longitude           double precision,
  accuracy_m          double precision,
  is_within_geofence  boolean,
  source              clock_source NOT NULL DEFAULT 'mobile',
  idempotency_key     uuid NOT NULL,
  approved_at         timestamptz,
  approved_by         uuid REFERENCES profiles(id),
  created_at          timestamptz NOT NULL DEFAULT now(),
  deleted_at          timestamptz,
  UNIQUE (idempotency_key)
);

-- ============================================================
-- PUSH TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS push_tokens (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        uuid NOT NULL REFERENCES profiles(id),
  expo_push_token   text NOT NULL,
  platform          text NOT NULL CHECK (platform IN ('ios', 'android')),
  created_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (expo_push_token)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS ON tenants (deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ON locations (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ON profiles (tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ON rosters (tenant_id, week_start) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ON shifts (tenant_id, roster_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ON shifts (profile_id, start_time) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ON clock_events (tenant_id, profile_id, recorded_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS ON availability (tenant_id, profile_id);

-- ============================================================
-- REALTIME (must set REPLICA IDENTITY FULL before enabling)
-- ============================================================
ALTER TABLE rosters REPLICA IDENTITY FULL;
ALTER TABLE shifts REPLICA IDENTITY FULL;
ALTER TABLE clock_events REPLICA IDENTITY FULL;
```

#### Step 1A.3 — Write RLS helper function

Create `supabase/migrations/20240002_rls_helpers.sql`:

```sql
-- SECURITY DEFINER so it runs as the function definer (postgres),
-- bypassing any per-row RLS on profiles while still reading the
-- calling user's ID from auth.uid().
CREATE OR REPLACE FUNCTION is_tenant_member(p_tenant_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM tenant_members tm
    WHERE tm.tenant_id = p_tenant_id
      AND tm.profile_id = (SELECT auth.uid())
      AND tm.deleted_at IS NULL
  );
$$;

-- Helper: get role for current user in a tenant
CREATE OR REPLACE FUNCTION get_tenant_role(p_tenant_id uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tm.role
  FROM tenant_members tm
  WHERE tm.tenant_id = p_tenant_id
    AND tm.profile_id = (SELECT auth.uid())
    AND tm.deleted_at IS NULL
  LIMIT 1;
$$;
```

#### Step 1A.4 — Write RLS policies

Create `supabase/migrations/20240003_rls_policies.sql`:

```sql
-- Enable RLS on every table
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE clock_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;

-- TENANTS: member can read; only owner can update
CREATE POLICY "tenant_member_read" ON tenants
  FOR SELECT USING (is_tenant_member(id));

CREATE POLICY "tenant_owner_update" ON tenants
  FOR UPDATE USING (get_tenant_role(id) IN ('owner'));

-- LOCATIONS: any member can read; manager/owner can write
CREATE POLICY "location_member_read" ON locations
  FOR SELECT USING (is_tenant_member(tenant_id) AND deleted_at IS NULL);

CREATE POLICY "location_manager_write" ON locations
  FOR ALL USING (get_tenant_role(tenant_id) IN ('owner', 'manager'));

-- PROFILES: members can read others in the same tenant; users can update their own
CREATE POLICY "profile_member_read" ON profiles
  FOR SELECT USING (is_tenant_member(tenant_id) AND deleted_at IS NULL);

CREATE POLICY "profile_self_update" ON profiles
  FOR UPDATE USING (id = (SELECT auth.uid()));

CREATE POLICY "profile_manager_write" ON profiles
  FOR ALL USING (get_tenant_role(tenant_id) IN ('owner', 'manager'));

-- TENANT_MEMBERS: members can see their own row; managers can see all
CREATE POLICY "tenant_member_self_read" ON tenant_members
  FOR SELECT USING (
    profile_id = (SELECT auth.uid()) OR
    get_tenant_role(tenant_id) IN ('owner', 'manager')
  );

-- ROSTERS: all members read; manager/owner write
CREATE POLICY "roster_member_read" ON rosters
  FOR SELECT USING (is_tenant_member(tenant_id) AND deleted_at IS NULL);

CREATE POLICY "roster_manager_write" ON rosters
  FOR ALL USING (get_tenant_role(tenant_id) IN ('owner', 'manager'));

-- SHIFTS: all members read; manager/owner write
CREATE POLICY "shift_member_read" ON shifts
  FOR SELECT USING (is_tenant_member(tenant_id) AND deleted_at IS NULL);

CREATE POLICY "shift_manager_write" ON shifts
  FOR ALL USING (get_tenant_role(tenant_id) IN ('owner', 'manager'));

-- AVAILABILITY: employee reads/writes own; manager reads all
CREATE POLICY "availability_self_write" ON availability
  FOR ALL USING (profile_id = (SELECT auth.uid()) AND is_tenant_member(tenant_id));

CREATE POLICY "availability_manager_read" ON availability
  FOR SELECT USING (get_tenant_role(tenant_id) IN ('owner', 'manager'));

-- CLOCK EVENTS: employee inserts/reads own; manager reads all
CREATE POLICY "clock_event_self_insert" ON clock_events
  FOR INSERT WITH CHECK (
    profile_id = (SELECT auth.uid()) AND is_tenant_member(tenant_id)
  );

CREATE POLICY "clock_event_self_read" ON clock_events
  FOR SELECT USING (
    (profile_id = (SELECT auth.uid()) OR get_tenant_role(tenant_id) IN ('owner', 'manager'))
    AND deleted_at IS NULL
  );

CREATE POLICY "clock_event_manager_update" ON clock_events
  FOR UPDATE USING (get_tenant_role(tenant_id) IN ('owner', 'manager'));

-- PUSH TOKENS: user manages own tokens only
CREATE POLICY "push_token_self" ON push_tokens
  FOR ALL USING (profile_id = (SELECT auth.uid()));
```

#### Verification

```bash
# 1. Verify schema matches current NeonDB
psql "postgresql://..." -f supabase/migrations/20240001_core_schema.sql
# Expected: CREATE TABLE / CREATE INDEX / NOTICE already exists

# 2. Verify RLS is enabled
psql "postgresql://..." -c "SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';"
# Expected: All tables show rowsecurity = true

# 3. Save output
cat > .sisyphus/evidence/task-1a-schema-export.txt << 'EOF'
[Tables created and RLS enabled]
EOF
```

#### Commit

```bash
git add supabase/migrations/
git commit -m "chore(db): document NeonDB schema with RLS policies"
```

---

### Priority 1B: Build Roster Grid UI (Task 4 Bridge)

> **Why**: This is the core scheduling UI. Without it, the roster feature is unusable.

#### Preconditions
- `apps/web/src/store/rosterStore.ts` exists ✅
- `apps/web/src/lib/neon/shiftService.ts` exists ✅
- Clerk middleware protecting `/roster` ✅

#### Step 1B.1 — Install DnD dependencies

```bash
cd apps/web
yarn add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @dnd-kit/modifiers
yarn add @tanstack/react-virtual
```

#### Step 1B.2 — Create ShiftCard component

Create `apps/web/src/features/roster/ShiftCard.tsx`:

```typescript
"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Shift } from "@/types/shift";

interface ShiftCardProps {
  shift: Shift;
  onClick?: () => void;
}

export function ShiftCard({ shift, onClick }: ShiftCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: shift.id!,
    data: { shift },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const startTime = new Date(shift.start_time);
  const endTime = new Date(shift.end_time);
  const timeStr = `${startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - ${endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      role="button"
      tabIndex={0}
      onClick={onClick}
      className={`
        bg-blue-500 text-white rounded px-2 py-1 text-xs cursor-grab
        hover:bg-blue-600 active:cursor-grabbing
        ${isDragging ? "shadow-lg ring-2 ring-blue-300" : ""}
      `}
      aria-label={`Shift from ${timeStr}${shift.role_label ? `, ${shift.role_label}` : ""}`}
    >
      <div className="font-medium">{timeStr}</div>
      {shift.role_label && (
        <div className="text-white/80 text-[10px]">{shift.role_label}</div>
      )}
    </div>
  );
}
```

#### Step 1B.3 — Create RosterCell component

Create `apps/web/src/features/roster/RosterCell.tsx`:

```typescript
"use client";

import { useDroppable } from "@dnd-kit/core";
import { Shift } from "@/types/shift";
import { ShiftCard } from "./ShiftCard";

interface RosterCellProps {
  profileId: string;
  date: string; // YYYY-MM-DD
  shifts: Shift[];
  onShiftClick?: (shift: Shift) => void;
}

export function RosterCell({ profileId, date, shifts, onShiftClick }: RosterCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${profileId}:${date}`,
    data: { profileId, date },
  });

  const dayLabel = new Date(date + "T12:00:00Z").toLocaleDateString("en-AU", {
    weekday: "short",
    day: "numeric",
  });

  return (
    <div
      ref={setNodeRef}
      className={`
        min-h-[80px] border border-gray-200 p-1
        ${isOver ? "bg-blue-50 ring-2 ring-blue-300" : "bg-white"}
        transition-colors
      `}
    >
      <div className="text-[10px] text-gray-500 mb-1">{dayLabel}</div>
      <div className="space-y-1">
        {shifts.map((shift) => (
          <ShiftCard
            key={shift.id}
            shift={shift}
            onClick={() => onShiftClick?.(shift)}
          />
        ))}
      </div>
    </div>
  );
}
```

#### Step 1B.4 — Create RosterGrid component

Create `apps/web/src/features/roster/RosterGrid.tsx`:

```typescript
"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragEndEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRosterStore } from "@/store/rosterStore";
import { RosterCell } from "./RosterCell";
import { Shift } from "@/types/shift";
import { updateShift } from "@/lib/neon/shiftService";

// Generate 7 days starting from weekStart (Monday)
function getWeekDates(weekStart: string): string[] {
  const dates: string[] = [];
  const start = new Date(weekStart + "T12:00:00Z");
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return dates;
}

export function RosterGrid() {
  const {
    profiles,
    shifts,
    roster,
    selectedWeekStart,
    setSelectedWeekStart,
    loading,
    fetchCurrentRoster,
  } = useRosterStore();

  const [weekDates, setWeekDates] = useState<string[]>([]);
  const parentRef = useRef<HTMLDivElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sensors for DnD
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Load roster on mount
  useEffect(() => {
    const weekStart = selectedWeekStart || new Date().toISOString().split("T")[0];
    // TODO: Get tenantId from Clerk user
    // fetchCurrentRoster(tenantId, weekStart);
  }, []);

  // Update week dates when selectedWeekStart changes
  useEffect(() => {
    setWeekDates(getWeekDates(selectedWeekStart));
  }, [selectedWeekStart]);

  // Get shifts for a specific profile + date
  const getShiftsForCell = useCallback(
    (profileId: string, date: string): Shift[] => {
      return shifts.filter((shift) => {
        const shiftDate = shift.start_time.split("T")[0];
        return shift.profile_id === profileId && shiftDate === date;
      });
    },
    [shifts]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeShift = active.data.current?.shift as Shift;
      const { profileId: toProfileId, date: toDate } = over.data.current as {
        profileId: string;
        date: string;
      };

      if (!activeShift) return;

      // Calculate new times (preserve time, change date)
      const oldStart = new Date(activeShift.start_time);
      const oldEnd = new Date(activeShift.end_time);
      const newStart = new Date(toDate + "T" + oldStart.toISOString().split("T")[1]);
      const newEnd = new Date(toDate + "T" + oldEnd.toISOString().split("T")[1]);

      // Optimistic update in store
      useRosterStore.getState().updateShift({
        id: activeShift.id!,
        profile_id: toProfileId,
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
      });

      // Debounced save (5 seconds)
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await updateShift(activeShift.id!, {
            profile_id: toProfileId,
            start_time: newStart.toISOString(),
            end_time: newEnd.toISOString(),
          });
          console.log("Shift moved and saved");
        } catch (error) {
          console.error("Failed to save shift:", error);
          // TODO: Revert optimistic update on failure
        }
      }, 5000);
    },
    [shifts]
  );

  // Virtual row renderer for 30+ employees
  const rowVirtualizer = useVirtualizer({
    count: profiles.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5,
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            const prev = new Date(selectedWeekStart);
            prev.setDate(prev.getDate() - 7);
            setSelectedWeekStart(prev.toISOString().split("T")[0]);
          }}
          className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
        >
          ← Previous
        </button>
        <span className="font-medium">
          Week of {new Date(selectedWeekStart + "T12:00:00Z").toLocaleDateString("en-AU", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })}
        </span>
        <button
          onClick={() => {
            const next = new Date(selectedWeekStart);
            next.setDate(next.getDate() + 7);
            setSelectedWeekStart(next.toISOString().split("T")[0]);
          }}
          className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
        >
          Next →
        </button>
      </div>

      {/* Roster Status Badge */}
      {roster && (
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-1 text-xs rounded ${
              roster.status === "published"
                ? "bg-green-100 text-green-700"
                : "bg-yellow-100 text-yellow-700"
            }`}
          >
            {roster.status.toUpperCase()}
          </span>
          {roster.status === "published" && (
            <span className="text-xs text-gray-500">
              Published {roster.published_at ? new Date(roster.published_at).toLocaleDateString() : ""}
            </span>
          )}
        </div>
      )}

      {/* Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="overflow-auto" ref={parentRef}>
          {/* Header Row: Employee Name + 7 Day Columns */}
          <div
            className="grid gap-0 sticky top-0 bg-white z-10"
            style={{
              gridTemplateColumns: "180px repeat(7, minmax(100px, 1fr))",
            }}
          >
            <div className="border border-gray-200 bg-gray-50 px-2 py-2 font-medium text-sm">
              Employee
            </div>
            {weekDates.map((date) => (
              <div
                key={date}
                className="border border-gray-200 bg-gray-50 px-2 py-2 text-center text-sm"
              >
                {new Date(date + "T12:00:00Z").toLocaleDateString("en-AU", {
                  weekday: "short",
                  day: "numeric",
                })}
              </div>
            ))}
          </div>

          {/* Employee Rows */}
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: "100%",
              position: "relative",
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const profile = profiles[virtualRow.index];
              return (
                <div
                  key={profile.id}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  <div
                    className="grid gap-0"
                    style={{
                      gridTemplateColumns: "180px repeat(7, minmax(100px, 1fr))",
                    }}
                  >
                    {/* Employee Name Cell */}
                    <div className="border border-gray-200 px-2 py-1 flex items-center">
                      <span className="text-sm font-medium truncate">
                        {profile.first_name} {profile.last_name}
                      </span>
                    </div>

                    {/* Day Cells */}
                    {weekDates.map((date) => (
                      <RosterCell
                        key={`${profile.id}:${date}`}
                        profileId={profile.id}
                        date={date}
                        shifts={getShiftsForCell(profile.id, date)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </DndContext>
    </div>
  );
}
```

#### Step 1B.5 — Update roster page to use grid

Update `apps/web/src/app/roster/page.tsx`:

```typescript
import { RosterGrid } from "@/features/roster/RosterGrid";

export default function RosterPage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Roster</h1>
      <RosterGrid />
    </div>
  );
}
```

#### Verification

```bash
# 1. Build must pass
cd apps/web && yarn build
# Expected: 0 errors

# 2. E2E test: drag shift from Monday to Tuesday
npx playwright test e2e/roster.spec.ts
# Expected: shift moves, 5s debounce saves to DB
```

Save output to `.sisyphus/evidence/task-1b-roster-grid.png`.

#### Commit

```bash
git add apps/web/src/features/roster/
git add apps/web/src/app/roster/
git commit -m "feat(roster): add drag-and-drop roster grid with virtual rows"
```

---

### Priority 1C: Implement Timesheet Feature (Task 11 Bridge)

> **Why**: Timesheets are essential for payroll. Currently missing entirely.

#### Preconditions
- Clock events table exists in NeonDB ✅
- Profiles table exists ✅

#### Step 1C.1 — Create timesheet queries

Create `apps/web/src/features/timesheets/queries.ts`:

```typescript
import { sql } from "@/lib/neon/client";

export interface TimesheetRow {
  profile_id: string;
  first_name: string;
  last_name: string;
  email: string;
  date: string; // YYYY-MM-DD
  clock_in: string | null;
  clock_out: string | null;
  hours: number | null;
  location_name: string;
  is_within_geofence: boolean | null;
  approved_at: string | null;
  approved_by: string | null;
}

/**
 * Get timesheet rows for a tenant within a date range.
 * Pairs clock_in and clock_out events for each employee per day.
 */
export async function getTimesheetRows(
  tenantId: string,
  startDate: string,
  endDate: string
): Promise<TimesheetRow[]> {
  const rows = await sql`
    WITH paired_events AS (
      SELECT
        ce.profile_id,
        ce.recorded_at,
        ce.type,
        ce.is_within_geofence,
        l.name as location_name,
        DATE(ce.recorded_at AT TIME ZONE 'Australia/Melbourne') as event_date,
        ROW_NUMBER() OVER (
          PARTITION BY ce.profile_id, DATE(ce.recorded_at AT TIME ZONE 'Australia/Melbourne')
          ORDER BY ce.recorded_at
        ) as event_seq
      FROM clock_events ce
      JOIN locations l ON l.id = ce.location_id
      WHERE ce.tenant_id = ${tenantId}
        AND ce.deleted_at IS NULL
        AND ce.recorded_at >= ${startDate}
        AND ce.recorded_at < ${endDate}
    )
    SELECT
      p.id as profile_id,
      p.first_name,
      p.last_name,
      p.email,
      paired.event_date,
      clock_in.recorded_at as clock_in,
      clock_out.recorded_at as clock_out,
      CASE
        WHEN clock_in.recorded_at IS NOT NULL AND clock_out.recorded_at IS NOT NULL
        THEN ROUND(
          EXTRACT(EPOCH FROM (clock_out.recorded_at - clock_in.recorded_at)) / 3600,
          2
        )
        ELSE NULL
      END as hours,
      COALESCE(clock_in.location_name, clock_out.location_name) as location_name,
      clock_in.is_within_geofence
    FROM profiles p
    LEFT JOIN paired_events clock_in
      ON clock_in.profile_id = p.id
      AND clock_in.type = 'clock_in'
      AND clock_in.event_seq = 1
    LEFT JOIN paired_events clock_out
      ON clock_out.profile_id = p.id
      AND clock_out.type = 'clock_out'
      AND clock_out.event_seq = 1
    WHERE p.tenant_id = ${tenantId}
      AND p.deleted_at IS NULL
    ORDER BY p.last_name, p.first_name, paired.event_date
  `;

  return rows as TimesheetRow[];
}

export async function approveTimesheetRow(
  clockEventId: string,
  approverId: string
): Promise<void> {
  await sql`
    UPDATE clock_events
    SET approved_at = ${new Date().toISOString()},
        approved_by = ${approverId}
    WHERE id = ${clockEventId}
  `;
}

export async function approveAllTimesheetRows(
  tenantId: string,
  startDate: string,
  endDate: string,
  approverId: string
): Promise<number> {
  const result = await sql`
    UPDATE clock_events
    SET approved_at = ${new Date().toISOString()},
        approved_by = ${approverId}
    WHERE id IN (
      SELECT id FROM clock_events
      WHERE tenant_id = ${tenantId}
        AND deleted_at IS NULL
        AND recorded_at >= ${startDate}
        AND recorded_at < ${endDate}
        AND type = 'clock_in'
        AND approved_at IS NULL
    )
    RETURNING id
  `;
  return result.length;
}
```

#### Step 1C.2 — Create CSV export

Create `apps/web/src/features/timesheets/export.ts`:

```typescript
import type { TimesheetRow } from "./queries";

/**
 * Generates a CSV string from timesheet rows.
 * Australian conventions:
 * - Date format: DD/MM/YYYY
 * - Time format: HH:mm (24-hour)
 * - Hours: decimal to 2 places (8.00 not "8:00")
 */
export function generateTimesheetCSV(
  rows: TimesheetRow[],
  timezone: string = "Australia/Melbourne"
): string {
  const dtFmt = new Intl.DateTimeFormat("en-AU", {
    timeZone: timezone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
  const timeFmt = new Intl.DateTimeFormat("en-AU", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const headers =
    "Employee Name,Email,Date,Start,End,Hours,Location,Geofence,Approved\n";

  const lines = rows.map((row) => {
    const date = row.clock_in
      ? dtFmt.format(new Date(row.clock_in))
      : row.date;
    const start = row.clock_in
      ? timeFmt.format(new Date(row.clock_in))
      : "";
    const end = row.clock_out
      ? timeFmt.format(new Date(row.clock_out))
      : "Open";
    const hours = row.hours !== null ? row.hours.toFixed(2) : "";
    const geofence = row.is_within_geofence ? "Yes" : "No";
    const approved = row.approved_at ? "Yes" : "No";

    return [
      `"${row.first_name} ${row.last_name}"`,
      row.email,
      date,
      start,
      end,
      hours,
      `"${row.location_name}"`,
      geofence,
      approved,
    ].join(",");
  });

  return headers + lines.join("\n");
}
```

#### Step 1C.3 — Create timesheet page

Create `apps/web/src/app/timesheets/page.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { getTimesheetRows, approveAllTimesheetRows, type TimesheetRow } from "@/features/timesheets/queries";
import { generateTimesheetCSV } from "@/features/timesheets/export";

export default function TimesheetsPage() {
  const [rows, setRows] = useState<TimesheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  // Calculate date range for selected week
  const getWeekRange = () => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay() + 1 + weekOffset * 7); // Monday
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    return {
      start: weekStart.toISOString().split("T")[0],
      end: weekEnd.toISOString().split("T")[0],
    };
  };

  useEffect(() => {
    const fetchTimesheets = async () => {
      setLoading(true);
      // TODO: Get tenantId from Clerk user
      // const { start, end } = getWeekRange();
      // const data = await getTimesheetRows(tenantId, start, end);
      // setRows(data);
      setLoading(false);
    };
    fetchTimesheets();
  }, [weekOffset]);

  const handleApproveAll = async () => {
    // TODO: Get approverId from Clerk user
    // const { start, end } = getWeekRange();
    // await approveAllTimesheetRows(tenantId, start, end, approverId);
    // Refresh data
  };

  const handleExportCSV = () => {
    const csv = generateTimesheetCSV(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `timesheets-${getWeekRange().start}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Timesheets</h1>

      {/* Week Navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setWeekOffset((w) => w - 1)}
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
          >
            ← Previous
          </button>
          <span className="font-medium">
            Week of {new Date(getWeekRange().start + "T12:00:00Z").toLocaleDateString("en-AU", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
          <button
            onClick={() => setWeekOffset((w) => w + 1)}
            className="px-3 py-1 bg-gray-100 rounded hover:bg-gray-200"
          >
            Next →
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleApproveAll}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Approve All
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Export CSV
          </button>
        </div>
      </div>

      {/* Timesheet Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-left">Employee</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Date</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Start</th>
                <th className="border border-gray-300 px-4 py-2 text-left">End</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Hours</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Location</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Geofence</th>
                <th className="border border-gray-300 px-4 py-2 text-left">Approved</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                  <td className="border border-gray-300 px-4 py-2">
                    {row.first_name} {row.last_name}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {row.clock_in
                      ? new Date(row.clock_in).toLocaleDateString("en-AU")
                      : "—"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {row.clock_in
                      ? new Date(row.clock_in).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {row.clock_out
                      ? new Date(row.clock_out).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "Open"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">{row.hours ?? "—"}</td>
                  <td className="border border-gray-300 px-4 py-2">{row.location_name}</td>
                  <td className="border border-gray-300 px-4 py-2">
                    {row.is_within_geofence ? "✓" : "✗"}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {row.approved_at ? "✓" : ""}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                    No clock events for this week
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
```

#### Verification

```bash
# 1. Build must pass
cd apps/web && yarn build
# Expected: 0 errors

# 2. E2E test
npx playwright test e2e/timesheets.spec.ts
```

Save to `.sisyphus/evidence/task-1c-timesheet-export.csv`.

#### Commit

```bash
git add apps/web/src/features/timesheets/
git add apps/web/src/app/timesheets/
git commit -m "feat(timesheets): add timesheet view with clock event pairing and CSV export"
```

---

### Priority 1D: Add Free Tier Enforcement (Task 12 Bridge)

> **Why**: Currently anyone can invite unlimited employees. Need to enforce 5-employee limit.

#### Preconditions
- `apps/web/src/app/api/invite/route.ts` exists (verify)
- `tenants` table has `plan` column ✅

#### Step 1D.1 — Create billing limits utility

Create `apps/web/src/features/billing/limits.ts`:

```typescript
import { sql } from "@/lib/neon/client";

export const FREE_TIER_EMPLOYEE_LIMIT = 5;

export interface BillingStatus {
  allowed: boolean;
  reason?: "upgrade_required" | "plan_active";
  currentCount: number;
  maxCount: number;
  plan: string;
}

/**
 * Check if a tenant can add another employee.
 * Call this BEFORE creating the new profile.
 */
export async function checkBillingStatus(tenantId: string): Promise<BillingStatus> {
  // Get tenant plan
  const tenants = await sql`
    SELECT plan FROM tenants WHERE id = ${tenantId}
  `;

  if (tenants.length === 0) {
    return { allowed: false, reason: "upgrade_required", currentCount: 0, maxCount: 0, plan: "unknown" };
  }

  const plan = tenants[0].plan;

  // Starter/paid plans have unlimited employees
  if (plan !== "free") {
    return { allowed: true, reason: "plan_active", currentCount: 0, maxCount: Infinity, plan };
  }

  // Free tier: count active employees
  const profiles = await sql`
    SELECT id FROM profiles
    WHERE tenant_id = ${tenantId}
      AND deleted_at IS NULL
  `;

  const currentCount = profiles.length;
  const allowed = currentCount < FREE_TIER_EMPLOYEE_LIMIT;

  return {
    allowed,
    reason: allowed ? "plan_active" : "upgrade_required",
    currentCount,
    maxCount: FREE_TIER_EMPLOYEE_LIMIT,
    plan,
  };
}
```

#### Step 1D.2 — Update invite API to check limits

Update `apps/web/src/app/api/invite/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import { checkBillingStatus } from "@/features/billing/limits";
import { invitationSchema } from "@/lib/validators/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = invitationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { email, tenantId, role, firstName, lastName } = parsed.data;

    // Check billing/tier limits
    const billingStatus = await checkBillingStatus(tenantId);
    if (!billingStatus.allowed) {
      return NextResponse.json(
        {
          error: "upgrade_required",
          message: `You've reached the free tier limit of ${billingStatus.maxCount} employees. Upgrade to add more.`,
          currentCount: billingStatus.currentCount,
          maxCount: billingStatus.maxCount,
        },
        { status: 402 }
      );
    }

    // TODO: Send invitation email via Clerk or email service
    // For now, just return success
    return NextResponse.json({
      success: true,
      message: `Invitation sent to ${email}`,
    });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

#### Step 1D.3 — Add upgrade modal to team page

Create `apps/web/src/components/billing/UpgradeModal.tsx`:

```typescript
"use client";

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCount: number;
  maxCount: number;
}

export function UpgradeModal({ isOpen, onClose, currentCount, maxCount }: UpgradeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h2 className="text-xl font-bold mb-4">Upgrade Required</h2>
        <p className="text-gray-600 mb-4">
          You've reached the free tier limit of {maxCount} employees.
          You currently have {currentCount} employees.
        </p>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">Starter Plan</h3>
          <p className="text-2xl font-bold text-blue-900">
            $4 + GST <span className="text-sm font-normal">/ employee / month</span>
          </p>
          <ul className="mt-3 space-y-1 text-sm text-blue-800">
            <li>✓ Unlimited employees</li>
            <li>✓ Unlimited rosters</li>
            <li>✓ GPS time clock</li>
            <li>✓ Timesheet exports</li>
          </ul>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              // TODO: Redirect to Stripe checkout
              window.location.href = "/api/checkout";
            }}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Upgrade Now
          </button>
        </div>
      </div>
    </div>
  );
}
```

#### Verification

```bash
# 1. Build must pass
cd apps/web && yarn build
# Expected: 0 errors

# 2. Manual test: invite 6th employee should return 402
curl -X POST http://localhost:3000/api/invite \
  -H "Content-Type: application/json" \
  -d '{"email":"test6@test.com","tenantId":"...","role":"employee","firstName":"Test","lastName":"User"}'
# Expected: {"error":"upgrade_required",...}
```

#### Commit

```bash
git add apps/web/src/features/billing/
git add apps/web/src/components/billing/
git add apps/web/src/app/api/invite/route.ts
git commit -m "feat(billing): add free tier enforcement with 5 employee limit"
```

---

## Phase 2 — P1: Complete Important Features

### Priority 2A: Build Mobile App (Tasks 7, 8, 9)

> Full Expo app with roster view, availability, and time clock.

#### Step 2A.1 — Create Expo app scaffold

```bash
cd apps
npx create-expo-app@latest mobile --template blank-typescript
cd mobile
yarn add nativewind tailwindcss
yarn add -D @types/react @types/react-native
```

#### Step 2A.2 — (Follow Tasks 7, 8, 9 from original plan)

See original plan document for:
- `apps/mobile/app/_layout.tsx` — auth routing
- `apps/mobile/app/(tabs)/roster.tsx` — employee roster view
- `apps/mobile/app/(tabs)/timeclock.tsx` — GPS clock-in
- `apps/mobile/app/availability.tsx` — availability management
- `apps/mobile/features/timeclock/outbox.ts` — SQLite offline support
- `apps/mobile/features/timeclock/sync.ts` — outbox sync

---

### Priority 2B: Push Notification System (Task 10)

> Supabase Edge Functions + cron for shift reminders.

#### Step 2B.1 — Create push notification Edge Function

Create `supabase/functions/send-push-notification/index.ts`:

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface PushPayload {
  profileIds: string[];
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const { profileIds, title, body, data }: PushPayload = await req.json();

  const { data: tokens } = await supabase
    .from("push_tokens")
    .select("expo_push_token")
    .in("profile_id", profileIds);

  if (!tokens?.length) return new Response("no tokens", { status: 200 });

  const messages = tokens.map((t) => ({
    to: t.expo_push_token,
    title,
    body,
    data,
    sound: "default",
  }));

  const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });

  return new Response(JSON.stringify({ sent: messages.length }), { status: 200 });
});
```

---

### Priority 2C: Complete Stripe Integration (Task 12)

#### Step 2C.1 — Create Stripe webhook handler

Create `apps/web/src/app/api/webhooks/stripe/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { sql } from "@/lib/neon/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;

      await sql`
        UPDATE tenants
        SET plan = 'starter',
            stripe_subscription_id = ${invoice.subscription as string}
        WHERE stripe_customer_id = ${customerId}
      `;
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await sql`
        UPDATE tenants
        SET plan = 'free',
            stripe_subscription_id = NULL
        WHERE stripe_subscription_id = ${sub.id}
      `;
      break;
    }
  }

  return NextResponse.json({ received: true });
}
```

---

## Phase 3 — P2: Polish

### Priority 3A: pgTap RLS Isolation Tests (Task 2)

Create `supabase/tests/rls_isolation.test.sql` following the original plan.

### Priority 3B: Update Plan Document

Update `docs/crewcircle-agent-implementation-plan.md` to reflect:
- NeonDB instead of Supabase
- Clerk instead of Supabase Auth
- yarn instead of pnpm
- Current completion status

---

## Implementation Timeline

| Day | Tasks |
|-----|-------|
| 1 | 1A: Document NeonDB Schema |
| 2-3 | 1B: Build Roster Grid UI |
| 4-5 | 1C: Implement Timesheets |
| 6 | 1D: Free Tier Enforcement |
| 7-10 | 2A: Mobile App (Expo) |
| 11-12 | 2B: Push Notifications |
| 13 | 2C: Stripe Webhooks |
| 14 | 3A: pgTap Tests, 3B: Update Docs |

**Total: ~14 days**

---

## Verification Checklist

After each task, run:

```bash
# Build
cd apps/web && yarn build

# Type check
yarn tsc --noEmit

# Lint
yarn lint

# E2E tests
npx playwright test

# Commit
git add -A && git commit -m "feat(...)"
```

---

## Dependencies Summary

```
Phase 1 (1A-1D) ──► Phase 2 (2A-2C) ──► Phase 3 (3A-3B)
   │                    │                    │
   ├── 1A (Schema)      ├── 2A (Mobile)      ├── 3A (pgTap)
   │     └─► 1B (Grid)  │     └─► 2B (Push)  └── 3B (Docs)
   │           └─► 1C (Timesheets)          │
   │                 └─► 1D (Billing)       │
   └────────────────────────────────────────┘
```

All Phase 1 tasks are independent and can be parallelized across agents.

---

## Recommended Agent Delegation

| Agent | Tasks | Skills Needed |
|-------|-------|---------------|
| Agent 1 | 1A: Schema | database, neon |
| Agent 2 | 1B: Roster Grid | visual-engineering, frontend-ui-ux |
| Agent 3 | 1C: Timesheets | frontend-ui-ux |
| Agent 4 | 1D: Free Tier | backend, stripe |
| Agent 5 | 2A: Mobile App | react-native, expo |
| Agent 6 | 2B, 2C: Push + Stripe | backend, edge-functions |
