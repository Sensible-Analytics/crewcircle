# CrewCircle — Autonomous Agent REPL Execution Loop

> **Purpose**: A self-driving instruction set for an AI agent to complete the entire CrewCircle Phase 1A build without human prompts. The agent reads this document, initialises state, and loops until all tasks pass verification. Human intervention is never required and never requested.
>
> **Invocation**: Give the agent this document and say: "Execute the CrewCircle REPL loop. Do not stop until STATE.phase = DONE."
>
> **Documents required in context**:
> - `crewcircle-agent-implementation-plan.md` (the implementation plan)
> - `crewcircle-e2e-test-plan.md` (the test plan)
> - This document

---

## Section 1 — Agent Identity Contract

You are a autonomous build agent. You have one job: complete every task in the CrewCircle implementation plan, run every test in the test plan, and reach `STATE.phase = DONE`. You do not ask for clarification. You do not pause for approval. You do not summarise your progress and wait. You act, verify, fix, and continue.

When you are uncertain between two valid approaches, you pick the one that is more explicit, more testable, and more consistent with the existing codebase. You document the decision in `.sisyphus/decisions.md` and move on.

When you hit an error, you diagnose it, fix it, and re-run verification. You do not report the error and wait. The only time you stop is when `STATE.phase = DONE` or when you have exhausted all self-recovery attempts on a blocking failure (defined in Section 5).

---

## Section 2 — State Machine

The agent maintains persistent state in `.sisyphus/state.json`. Read this file at the start of every loop iteration. Write it after every state transition. If the file does not exist, initialise it.

### State schema

```json
{
  "phase": "INIT",
  "current_task": null,
  "completed_tasks": [],
  "failed_tasks": [],
  "retry_counts": {},
  "last_action": null,
  "last_action_time": null,
  "blocking_failures": [],
  "decisions": []
}
```

### Phase definitions

| Phase | Meaning | Transition trigger |
|---|---|---|
| `INIT` | State file created, workspace verified | Workspace checks pass |
| `EXECUTING` | Actively building a task | Task picked from queue |
| `VERIFYING` | Running tests for completed task | Implementation code written |
| `FIXING` | Error found, applying fix | Test failure detected |
| `BLOCKED` | Self-recovery exhausted on a task | retry_count >= MAX_RETRIES |
| `FINAL_VERIFICATION` | All tasks done, running full test suite | All tasks in completed_tasks |
| `DONE` | All tests pass, evidence manifest complete | Final verification passes |

### State transitions

```
INIT → EXECUTING         when: workspace verified, first task selected
EXECUTING → VERIFYING    when: implementation code written and committed
VERIFYING → EXECUTING    when: all tests for this task pass, next task selected
VERIFYING → FIXING       when: one or more tests fail
FIXING → VERIFYING       when: fix applied and committed
FIXING → BLOCKED         when: retry_count[task] >= 3
BLOCKED → EXECUTING      NEVER — blocked tasks are logged and skipped (see Section 5)
EXECUTING → FINAL_VERIFICATION  when: completed_tasks contains all 14 tasks
FINAL_VERIFICATION → DONE       when: full test suite passes
FINAL_VERIFICATION → FIXING     when: failures found in final suite
```

---

## Section 3 — Task Queue

The agent works through this queue in strict order. No task starts before its predecessors are in `completed_tasks`. This mirrors the dependency matrix from the implementation plan.

```
QUEUE = [
  { id: "T1",  name: "Monorepo + Infrastructure",           depends_on: [] },
  { id: "T2",  name: "Database Schema + RLS + pgTap",       depends_on: ["T1"] },
  { id: "T3",  name: "Auth System",                         depends_on: ["T1", "T2"] },
  { id: "T4",  name: "Roster Grid UI",                      depends_on: ["T2", "T3"] },
  { id: "T5",  name: "Shift CRUD + Conflict Detection",     depends_on: ["T4"] },
  { id: "T6",  name: "Roster Publish + Realtime",           depends_on: ["T5"] },
  { id: "T7",  name: "Mobile App Shell + Auth",             depends_on: ["T2", "T3"] },
  { id: "T8",  name: "Employee Roster View + Availability", depends_on: ["T7", "T6"] },
  { id: "T9",  name: "Time Clock + GPS + Offline",          depends_on: ["T7", "T5"] },
  { id: "T10", name: "Push Notification System",            depends_on: ["T6", "T7"] },
  { id: "T11", name: "Timesheet Generation + CSV Export",   depends_on: ["T9"] },
  { id: "T12", name: "Stripe AU Billing",                   depends_on: ["T3"] },
  { id: "T13", name: "Landing Page + Legal Pages",          depends_on: [] },
  { id: "T14", name: "Deploy + Submit Mobile Apps",         depends_on: ["T10","T11","T12","T13"] },
  { id: "F1",  name: "Plan Compliance Audit",               depends_on: ["T14"] },
  { id: "F2",  name: "Code Quality Review",                 depends_on: ["T14"] },
  { id: "F3",  name: "End-to-End QA",                       depends_on: ["T14"] },
  { id: "F4",  name: "Security Audit",                      depends_on: ["T14"] }
]
```

---

## Section 4 — The REPL Loop

```
LOOP:
  state = read_state()

  if state.phase == "DONE":
    print_completion_report()
    EXIT

  if state.phase == "INIT":
    run_workspace_init()
    state.phase = "EXECUTING"
    write_state(state)

  task = get_next_task(state)

  if task == null and all_tasks_complete(state):
    state.phase = "FINAL_VERIFICATION"
    write_state(state)
    run_final_verification(state)
    CONTINUE

  if task == null:
    # Dependencies not met — should not happen if queue is correct
    log_error("No task available but queue not empty — dependency cycle detected")
    EXIT

  state.current_task = task.id
  state.phase = "EXECUTING"
  write_state(state)

  # Build the task
  execute_task(task)

  state.phase = "VERIFYING"
  write_state(state)

  result = run_task_verification(task)

  if result.passed:
    commit_task(task)
    state.completed_tasks.append(task.id)
    state.current_task = null
    state.phase = "EXECUTING"
    write_state(state)
    CONTINUE

  # Verification failed
  state.retry_counts[task.id] = state.retry_counts.get(task.id, 0) + 1

  if state.retry_counts[task.id] >= 3:
    state.phase = "BLOCKED"
    state.blocking_failures.append({
      task: task.id,
      failures: result.failures,
      time: now()
    })
    write_state(state)
    handle_blocking_failure(task, result)
    CONTINUE

  state.phase = "FIXING"
  write_state(state)
  apply_fix(task, result.failures)
  CONTINUE
```

---

## Section 5 — Function Definitions

These are the concrete instructions for each function in the REPL loop. The agent executes these exactly.

---

### `run_workspace_init()`

```
1. Create .sisyphus/ directory if it does not exist
2. Create .sisyphus/evidence/ directory
3. Create .sisyphus/decisions.md with header: "# Agent Decisions Log"
4. Verify Node.js >= 20: run `node --version`, assert output starts with "v20" or higher
5. Verify pnpm >= 9: run `pnpm --version`, assert major version >= 9
6. Verify Supabase CLI: run `supabase --version`, assert exit 0
7. Verify GitHub remote is configured: run `git remote -v`, assert "origin" exists
8. Verify environment variables exist in .env.local (web) and apps/mobile/.env:
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
   - SUPABASE_SERVICE_ROLE_KEY
   If any are missing: write them from the Supabase project dashboard.
   The agent reads the project ref from supabase/config.toml and fetches keys
   via `supabase status`.
9. Write state.phase = "EXECUTING"
```

---

### `get_next_task(state)`

```
For each task in QUEUE (in order):
  if task.id in state.completed_tasks: CONTINUE
  if task.id in [b.task for b in state.blocking_failures]: CONTINUE
  if all task.depends_on are in state.completed_tasks: RETURN task
RETURN null
```

---

### `execute_task(task)`

The agent reads the corresponding task section from `crewcircle-agent-implementation-plan.md` and executes every step in order. The following sub-rules apply during execution:

**File writes**: write every file completely. Never truncate with `// ... rest of file`. If a file exceeds what fits in one tool call, split it into multiple writes using append mode.

**Shell commands**: run every command and assert the exit code. If exit code is non-zero, capture stdout and stderr, write to `.sisyphus/evidence/EXEC-{task.id}-{command-slug}.txt`, and treat it as a test failure (trigger the fix loop).

**Code generation rules — enforced on every file written**:
- Every database query includes `.eq("tenant_id", tenantId)` and `.is("deleted_at", null)`.
- Every timestamp uses `timestamptz` in SQL and `.toISOString()` in TypeScript. No `new Date().toLocaleDateString()`.
- Every `try/catch` block logs the error with `console.error` or surfaces it to the caller. No empty catches.
- Every import of `SUPABASE_SERVICE_ROLE_KEY` is inside a server-only file (`use server`, API route, or Edge Function). The agent verifies this by checking the file path — if the file is in `packages/` or is a `.tsx` client component, it is wrong.
- Every new table added to Supabase migrations also gets a corresponding RLS policy and a pgTap test.

**After every file is written**, the agent runs the file's linter locally:
```bash
# TypeScript files
pnpm --filter <package> tsc --noEmit
# If exit non-zero: fix TypeScript errors before moving to the next step
```

**After all files for a task are written**: run the pre-commit check defined in the task's "Commit" section. If it fails, treat as a verification failure and enter the fix loop before committing.

---

### `run_task_verification(task)`

The agent reads the QA Scenarios section for the task from the implementation plan and the corresponding test suite from the test plan. It runs them in this order:

```
1. Unit tests (if applicable):
   pnpm --filter validators test --reporter=verbose
   Capture stdout. Parse for "X passed, Y failed".
   If Y > 0: failures = list of failed test names. Return { passed: false, failures }

2. Database tests (if applicable, tasks T2 and up):
   supabase test db
   Capture stdout. Parse for failing test names.
   If any failures: Return { passed: false, failures }

3. Build check:
   pnpm turbo build
   If exit non-zero: Return { passed: false, failures: ["build failed", stderr] }

4. Playwright tests (if applicable, tasks T3 and up):
   npx playwright test tests/web/{task-spec}.spec.ts --reporter=json
   Read JSON output. Collect all failed test titles.
   If any failures: Return { passed: false, failures: [list of titles] }

5. Check evidence files exist:
   For each evidence file listed in the task's QA Scenarios:
     If file does not exist: Return { passed: false, failures: ["Missing evidence: {path}"] }

Return { passed: true, failures: [] }
```

---

### `apply_fix(task, failures)`

The agent reads each failure message and applies the corresponding fix. The fix strategy depends on the failure type:

**TypeScript compile error**:
```
Read the error message. It contains: file path, line number, error code (e.g., TS2345).
Open the file at the given line. Read 20 lines of context around it.
Apply the minimal change that resolves the error without changing function signatures.
Common fixes:
  TS2345 (argument type mismatch): add type assertion or fix the type definition
  TS2339 (property does not exist): add property to interface or use optional chaining
  TS7006 (implicit any): add explicit type annotation
Re-run: pnpm --filter <package> tsc --noEmit
```

**pgTap test failure**:
```
Read the failing test name. It is in the format:
  "Bob: cannot see Tenant A rosters"
Locate the test in supabase/tests/*.test.sql.
The failure means either:
  (a) The RLS policy is missing or has the wrong table/column name
  (b) The is_tenant_member() function has a bug
  (c) Test setup did not create the correct tenant_member row
Fix:
  Open supabase/migrations/ and check the RLS policy for the failing table.
  Verify: is_tenant_member(tenant_id) is in the USING clause.
  Verify: deleted_at IS NULL is in the USING clause.
  If missing: add the policy. Run: supabase db push. Re-run: supabase test db.
```

**Playwright test failure — selector not found**:
```
Read the error: "waiting for selector [data-testid='X']"
Open the React component that renders this UI element.
Add data-testid="X" to the correct DOM element.
Re-run the specific test: npx playwright test tests/web/{spec} --grep "test name"
```

**Playwright test failure — assertion mismatch**:
```
Error pattern: "Expected: 'X', Received: 'Y'"
This usually means:
  (a) Supabase query returned wrong data — check tenant_id filter
  (b) Time formatting is wrong — check Intl.DateTimeFormat with correct IANA timezone
  (c) State update is stale — check that the component re-fetches after mutation
Fix the component or the query. Re-run the test.
```

**Build failure — missing module**:
```
Error: "Cannot find module '@crewcircle/X'"
Check pnpm-workspace.yaml includes the package directory.
Check the package's package.json has the correct "name" field.
Run: pnpm install. Re-run: pnpm turbo build.
```

**Supabase push failure — migration syntax error**:
```
Read the SQL error. It contains line number and error type.
Open the migration file. Fix the SQL syntax at the indicated line.
Common SQL mistakes:
  Missing semicolon at end of statement
  Referencing a table before it is created (fix ordering)
  Using a type that was not yet created (move CREATE TYPE before the table)
Run: supabase db push. Re-run: supabase test db.
```

After applying the fix, the agent writes a decision entry:

```
Append to .sisyphus/decisions.md:
  ## Fix applied at {timestamp}
  Task: {task.id}
  Failure: {failure message}
  Fix: {one-sentence description of what was changed}
  File: {file path}
```

---

### `commit_task(task)`

```
1. Run the pre-commit check from the task definition:
   pnpm turbo build && pnpm turbo lint
   If this fails: enter fix loop before committing.

2. Stage all changes:
   git add -A

3. Commit with the message from the task definition:
   git commit -m "{task commit message}"

4. Push:
   git push origin main

5. Write to .sisyphus/evidence/commit-{task.id}.txt:
   {commit hash} {commit message} {timestamp}
```

---

### `run_final_verification(state)`

```
1. Run full pgTap suite:
   supabase test db
   Save to .sisyphus/evidence/final-pgtap.txt

2. Run full Vitest suite:
   pnpm turbo test
   Save to .sisyphus/evidence/final-vitest.txt

3. Run full Playwright suite:
   npx playwright test tests/web/ --reporter=json
   Save to .sisyphus/evidence/final-playwright.json

4. Run security audit:
   grep -r "service_role" apps/web/.next/static/ | wc -l → assert 0
   grep -rn "DELETE FROM\|\.delete()" apps/ packages/ --include="*.ts" | grep -v "deleted_at" → assert 0
   Save to .sisyphus/evidence/final-security.txt

5. Run Lighthouse:
   lhci autorun --collect.url=http://localhost:3000
   Assert performance > 0.90, accessibility > 0.90, SEO > 0.90
   Save to .sisyphus/evidence/final-lighthouse.json

6. Verify evidence manifest:
   For each file in the evidence manifest table from the test plan:
     If file does not exist: log "MISSING: {path}" and treat as failure

7. If all pass:
   state.phase = "DONE"
   write_state(state)
   print_completion_report()

8. If any fail:
   state.phase = "FIXING"
   apply_fix to the appropriate task
   state.phase = "FINAL_VERIFICATION"
   run_final_verification(state)  -- recurse until pass or retry exhausted
```

---

### `handle_blocking_failure(task, result)`

A blocking failure means the agent has tried 3 times and the task still fails. The agent does not stop. It:

```
1. Writes a detailed failure report to .sisyphus/evidence/BLOCKED-{task.id}.md:
   # Blocked: {task.name}
   ## Failure messages
   {result.failures}
   ## Files modified (last attempt)
   {git diff HEAD~1 --name-only}
   ## What was tried
   {decisions log entries for this task}

2. Marks the task as blocked in state:
   state.blocking_failures.append({ task: task.id, reason: result.failures })

3. Checks if downstream tasks can still run without this task:
   For each task in QUEUE where task.depends_on contains blocked_task.id:
     Add that task to blocked list too (cascading block)
     Log to .sisyphus/decisions.md: "Cascade blocked: {task.id} because {blocked_task.id} is blocked"

4. Continues the loop with the next unblocked task.

5. At the end of the full run, the completion report lists all blocked tasks
   with their failure details so a human can address them in one pass.
```

---

### `print_completion_report()`

```
Write .sisyphus/COMPLETION_REPORT.md with:

# CrewCircle Phase 1A — Agent Completion Report
Generated: {timestamp}

## Summary
- Total tasks: 18 (T1–T14, F1–F4)
- Completed: {len(state.completed_tasks)}
- Blocked: {len(state.blocking_failures)}
- Total retries used: {sum(state.retry_counts.values())}

## Completed Tasks
{for each task in state.completed_tasks}
  - {task.id}: {task.name} — commit: {commit hash from evidence file}

## Blocked Tasks (require human attention)
{for each blocked in state.blocking_failures}
  ### {blocked.task}
  Failure: {blocked.reason}
  Details: .sisyphus/evidence/BLOCKED-{blocked.task}.md

## Verification Results
- pgTap: {pass/fail count from final-pgtap.txt}
- Vitest: {pass/fail count from final-vitest.txt}
- Playwright: {pass/fail count from final-playwright.json}
- Security: {result from final-security.txt}
- Lighthouse: {performance/accessibility/SEO scores}

## Evidence Files
{list all files in .sisyphus/evidence/ with sizes}

## Decisions Log
{contents of .sisyphus/decisions.md}
```

---

## Section 6 — Self-Correction Heuristics

The agent applies these heuristics before entering the fix loop to resolve common issues without counting against the retry budget.

### Heuristic H1 — Missing data-testid attributes

Before running Playwright tests, the agent scans every component that is tested in the Playwright suite and verifies the expected `data-testid` attributes exist in the JSX. If any are missing, the agent adds them before running tests. This is not a fix — it is a pre-flight check.

```
For each spec file in tests/web/:
  Read all strings matching data-testid='X' from the spec
  For each X:
    grep -r "data-testid=\"X\"" apps/web/
    If not found: locate the component that renders this UI element and add the attribute
```

### Heuristic H2 — Supabase types out of date

After every database migration (`supabase db push`), the agent regenerates TypeScript types:

```bash
supabase gen types typescript --local > packages/supabase/src/database.types.ts
```

If this step is skipped, TypeScript compile errors cascade through every file that imports the types.

### Heuristic H3 — pnpm lockfile mismatch

If `pnpm install` fails with a lockfile mismatch:

```bash
pnpm install --no-frozen-lockfile
git add pnpm-lock.yaml
git commit -m "chore: update pnpm lockfile"
```

### Heuristic H4 — Port already in use

If the Next.js dev server fails to start because port 3000 is in use:

```bash
lsof -ti:3000 | xargs kill -9
pnpm --filter web dev &
sleep 5
```

### Heuristic H5 — Supabase local instance not running

If Supabase CLI commands fail with "not running":

```bash
supabase start
# Wait for healthy status
supabase status
```

### Heuristic H6 — Edge Function deploy fails

If `supabase functions deploy` fails with a Deno import error:

```
Read the import URL. Check it uses versioned ESM:
  https://esm.sh/@supabase/supabase-js@2  -- correct
  https://esm.sh/@supabase/supabase-js    -- may resolve to breaking version
Add explicit version pins to all ESM imports in the Edge Function.
```

### Heuristic H7 — RLS policy blocks own data

If a logged-in user cannot see their own data, the most common cause is a missing `tenant_members` row. The agent checks:

```sql
SELECT * FROM tenant_members WHERE profile_id = auth.uid();
```

If empty: the signup action did not create the row. Find the server action and add the insert.

---

## Section 7 — Scope Guardrails

The agent checks these on every file write. If a file being written violates a guardrail, the agent stops writing, deletes the file, and rewrites it correctly.

| Guardrail | Check | Automatic fix |
|---|---|---|
| No hard deletes | `grep -n "\.delete()\." <file>` returns results not containing `deleted_at` | Rewrite as `UPDATE ... SET deleted_at = now()` |
| No service role in client | File in `apps/web/app/` but imports `SUPABASE_SERVICE_ROLE_KEY` | Move logic to a `route.ts` or `actions.ts` with `"use server"` |
| No local time storage | `grep "toLocaleDateString\|toLocaleTimeString\|new Date().toLocal" <file>` | Rewrite using `Intl.DateTimeFormat` with IANA timezone |
| No bare `auth.jwt()` in SQL | `grep "auth.jwt()" <migration>` | Rewrite using `is_tenant_member()` or `get_tenant_role()` |
| UTC timestamps in SQL | Any `timestamp` column without `tz` suffix | Rename to `timestamptz` |
| Every table has tenant_id | New migration creates table without `tenant_id` | Add column with `NOT NULL REFERENCES tenants(id)` |
| Every table has deleted_at | New migration creates table without `deleted_at` | Add `deleted_at timestamptz` column |
| Soft delete filter in queries | Supabase query does not include `.is("deleted_at", null)` | Add filter |
| No SMS | File imports Twilio or references SMS sending | Remove — out of scope for Phase 1A |
| No payroll | File references `award`, `penalty_rate`, `overtime` | Remove — out of scope |

---

## Section 8 — Task-Specific Execution Instructions

These supplement the implementation plan with agent-specific clarifications that remove ambiguity.

### T1 — Monorepo Setup

Run steps in this exact order. Do not parallelise.

```
Step 1: mkdir crewcircle && cd crewcircle && git init
Step 2: Write pnpm-workspace.yaml
Step 3: Write root package.json
Step 4: Write turbo.json
Step 5: pnpm create next-app apps/web (with flags from plan)
Step 6: pnpm create expo-app apps/mobile
Step 7: mkdir packages/supabase packages/validators packages/ui-shared
Step 8: Write package.json for each package
Step 9: Write metro.config.js
Step 10: supabase init
Step 11: Write .env files
Step 12: pnpm install
Step 13: pnpm turbo build  → MUST PASS before moving to T2
Step 14: Write GitHub Actions CI file
Step 15: git add -A && git commit && git push
```

Decision rule: if `pnpm create next-app` prompts for interactive input, pass all options as CLI flags. Never wait for interactive input.

### T2 — Database Schema

After writing every migration file, run:

```bash
supabase db reset  # applies all migrations from scratch
supabase gen types typescript --local > packages/supabase/src/database.types.ts
supabase test db
```

Run `supabase db reset` (not `push`) to catch ordering errors. `push` applies only new migrations and can hide problems.

### T3 — Auth System

The signup server action uses `adminClient.auth.admin.createUser`. This requires the service role key. Verify the action file has `"use server"` at the top. Verify it is in `apps/web/app/` not `packages/`.

After writing the middleware, test it by running:

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/dashboard
# Expected: 302
```

If the result is 200, the middleware is not matching the path pattern. Fix the `matcher` config.

### T4 — Roster Grid

After writing the Zustand store, write a quick Vitest snapshot test to verify the `moveShift` action:

```typescript
import { useRosterStore } from "./store";

test("moveShift updates cell key correctly", () => {
  const store = useRosterStore.getState();
  store.actions.loadShifts([{
    id: "s1", profile_id: "p1",
    start_time: "2026-04-06T09:00:00Z",
    end_time: "2026-04-06T17:00:00Z",
  } as any]);
  store.actions.moveShift("s1", "p2", "2026-04-07");
  const state = useRosterStore.getState();
  expect(state.cellShifts["p2:2026-04-07"]).toHaveLength(1);
  expect(state.cellShifts["p1:2026-04-06"]).toHaveLength(0);
});
```

Run this test before writing the React component. If it fails, fix the store. The component test is much harder to debug than the store test.

### T5 — Shift CRUD

Write ALL Vitest tests in `conflicts.test.ts` BEFORE writing the implementation. The tests define the expected behaviour. Then write the implementation to make them pass. This is the only task in the plan that uses a test-first approach because the conflict logic has enough edge cases that writing tests after often misses them.

### T6 — Publish Workflow

The Realtime test requires two browser contexts. Playwright supports this natively. Verify the `REPLICA IDENTITY FULL` is set on the `rosters` table before writing the test — Realtime will not emit full row data without it.

```sql
-- Verify via psql:
SELECT relreplident FROM pg_class WHERE relname = 'rosters';
-- Expected: f (FULL)
-- If d (DEFAULT): run ALTER TABLE rosters REPLICA IDENTITY FULL;
```

### T7 — Mobile Shell

After writing the app, run a build verification:

```bash
cd apps/mobile
npx expo export --platform web  # Fast check that bundle compiles
```

This is faster than a full EAS build and catches TypeScript and import errors without needing a device.

### T9 — Time Clock

The SQLite outbox is the most failure-prone piece. Write a manual test fixture that verifies the outbox round-trip in isolation:

```bash
# Start the app in dev mode
# In a second terminal, simulate no network by blocking Supabase host:
# (macOS) sudo pfctl -e -f /dev/stdin <<EOF
# block out quick to <supabase.co>
# EOF
# Clock in via the app UI
# Check SQLite: expo-sqlite viewer or print via console
# Re-enable network
# Verify supabase clock_events has the row
```

### T12 — Billing

Stripe webhooks require a public URL. In development, use the Stripe CLI to forward events:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook signing secret printed by the CLI
# Update STRIPE_WEBHOOK_SECRET in .env.local
```

The agent runs this in a background process during T12 verification.

### T14 — Deploy

Before deploying, run a final local production build:

```bash
cd apps/web
pnpm build
pnpm start &
sleep 5
curl -f http://localhost:3000
```

If this fails, fix before pushing to Vercel. A broken production build wastes a deployment slot.

---

## Section 9 — Progress Checkpoints

The agent writes a checkpoint to `.sisyphus/progress.md` after each completed task. This file is append-only and serves as a human-readable audit trail.

```markdown
## {timestamp} — T{N} COMPLETE

- Task: {task.name}
- Duration: {minutes} min
- Retries used: {count}
- Tests passing: {pgTap count} pgTap / {Vitest count} Vitest / {Playwright count} Playwright
- Commit: {hash}
- Next: {next task name}
```

---

## Section 10 — Loop Kickoff

When the agent receives the instruction to start, it executes this sequence exactly once:

```
1. Read crewcircle-agent-implementation-plan.md into working memory
2. Read crewcircle-e2e-test-plan.md into working memory
3. Read this document into working memory
4. Check if .sisyphus/state.json exists:
   YES: read it — the agent is resuming a previous run
   NO:  initialise state as defined in Section 2
5. Check state.phase:
   DONE: print_completion_report() and exit
   Any other: enter the REPL loop at Section 4
6. Never ask the human for confirmation. Never print "Should I proceed?".
   Execute the next action immediately.
```

---

## Section 11 — Resumability

If the agent process is interrupted (context window limit, tool timeout, crash), it can resume by:

```
1. Reading .sisyphus/state.json to find state.current_task and state.completed_tasks
2. If state.phase == "EXECUTING": the task was started but not committed
   Action: check git status — if there are unstaged changes, the task was partially done
   Action: run verification for the current task to see what passes and what fails
   Action: enter the fix loop if needed, or commit if all pass
3. If state.phase == "VERIFYING": tests were running
   Action: re-run verification from scratch
4. If state.phase == "FIXING": a fix was in progress
   Action: re-read the last decision log entry to understand what was being fixed
   Action: verify if the fix was applied by reading the file that was being modified
   Action: re-run verification
5. Continue the REPL loop from the current state
```

The `.sisyphus/` directory is never deleted between runs. It is the agent's memory.
