# Phase 4 Execution Plan — Polish, Analytics & Deploy

**Generated:** 2026-04-03
**Phase status:** NOT STARTED
**Estimated tasks remaining:** 7

## Current State Summary

Phase 3 is fully implemented in `.worktrees/phase-3` (org API, customize page, embed page, dynamic
brand color in launcher.js, and org tests) but has not yet been merged to `main`. Phase 4 cannot
begin until the Phase 3 worktree is merged. Once merged, the platform has: auth, document ingestion,
RAG chat via CopilotKit/DeepSeek, an embeddable iframe widget, and a dashboard with content/customize/embed
pages. What is missing for Phase 4: the analytics dashboard (no page, no API), production hardening
(health check only pings `{ status: 'ok' }` without a DB query, no input length limits, no structured
chat logging, no error boundaries), a demo tenant (seed data + `/demo` page), and a CI pipeline.
Sentry and Vercel/Supabase production deployment are developer-action items noted in the pre-flight
checklist.

## Exit Criterion

A live, publicly accessible product with a working analytics dashboard, hardened API, a demo tenant
embedded at `/demo`, and a GitHub Actions CI pipeline that runs type-checking and lint on every PR.

## Task Breakdown

---

### Task 1: Analytics backend API

- **File targets:**
  - `server/routes/analytics.ts` — CREATE
  - `server/controller/analytics.controller.ts` — CREATE
  - `server/services/analytics.service.ts` — CREATE
  - `server/index.ts` — WIRE IN (`app.route('/api/analytics', analyticsRoutes)`, CORS restricted to CLIENT_URL, protected by authMiddleware)
- **Assigned agent:** `backend-engineer`
- **Depends on:** none
- **Gotchas:**
  - All queries must filter by `orgId` from the JWT payload — never return cross-tenant data.
  - Required endpoints (all `GET`, all protected by `authMiddleware`):
    - `GET /api/analytics/summary?range=today|7d|30d` — returns:
      ```json
      { "totalMessages": 0, "unansweredCount": 0, "unansweredRate": 0.0, "totalConversations": 0 }
      ```
    - `GET /api/analytics/messages-over-time?range=today|7d|30d` — returns daily buckets:
      ```json
      [{ "date": "2026-04-01", "count": 42 }, ...]
      ```
    - `GET /api/analytics/busiest-hours` — returns 24 hourly buckets (always over last 30 days):
      ```json
      [{ "hour": 0, "count": 5 }, { "hour": 1, "count": 2 }, ...]
      ```
    - `GET /api/analytics/unanswered?limit=50` — returns recent unanswered user messages:
      ```json
      [{ "id": "...", "content": "...", "createdAt": "..." }, ...]
      ```
  - Use Drizzle ORM with `sql` template tag for date_trunc queries. Import `sql` from `drizzle-orm`.
  - `date_trunc('day', messages.createdAt)` requires casting to Postgres timestamptz — check how other services use `db` before writing raw SQL.
  - Mirror the auth pattern from `server/controller/ingest.controller.ts`: extract `orgId` from `c.get('jwtPayload')`.
  - Wire CORS for `/api/analytics/*` to `process.env.CLIENT_URL ?? 'http://localhost:3000'` with `credentials: true` — same pattern as ingest in `server/index.ts`.

---

### Task 2: Analytics dashboard page

- **File targets:**
  - `client/src/app/dashboard/analytics/page.tsx` — CREATE
  - `client/src/services/analytics.ts` — CREATE
  - `client/src/hooks/use-analytics.ts` — CREATE
- **Assigned agent:** `frontend-ui-architect`
- **Depends on:** Task 1
- **Gotchas:**
  - Any file that imports from `recharts` MUST have `"use client"` at the very top (line 1) — Next.js will fail to compile otherwise. Recharts is already installed (`"recharts": "^3.8.1"` in `client/package.json`).
  - Layout: time-range picker (Today / 7 Days / 30 Days) at the top controlling all widgets; 4 stat cards (Total Messages, Unanswered Rate, Total Conversations, Unanswered Count); a `LineChart` for messages over time; a `BarChart` for busiest hours; a table of unanswered questions.
  - Read `client/src/app/dashboard/content/page.tsx` before implementing — follow its exact patterns for fetching, loading states, and error handling.
  - The `use-analytics` hook should accept the selected range and re-fetch when it changes.
  - Auth token pattern: mirror `client/src/services/ingest.ts` — do not invent a new approach.
  - Recharts requires explicit `width` and `height` on chart containers, or wrap in a `ResponsiveContainer` with `width="100%" height={300}`.
  - Format the unanswered rate as a percentage (multiply float by 100, round to 1 decimal place).
  - Check `client/src/components/dashboard/sidebar.tsx` — ensure "Analytics" nav link points to `/dashboard/analytics`. Add it if missing.

---

### Task 3: Production hardening — backend

- **File targets:**
  - `server/index.ts` — MODIFY (upgrade health check; add CORS for `/api/analytics/*`)
  - `server/middleware/validate.ts` — CREATE (input sanitisation helper)
  - `server/controller/ingest.controller.ts` — MODIFY (apply max-length validation)
  - `server/controller/chat.controller.ts` — MODIFY (apply max-length validation + request logging)
  - `server/controller/org.controller.ts` — MODIFY (apply Zod-enforced max-length — already has Zod; verify limits are present)
- **Assigned agent:** `backend-engineer`
- **Depends on:** none
- **Gotchas:**
  - **Health check upgrade**: change `GET /api/health` to run a lightweight DB query (e.g., `SELECT 1`) and return `{ status: 'ok' | 'degraded', db: 'ok' | 'error' }`. Import `db` from `server/db/connection.ts` and wrap the query in try/catch — return 503 if DB fails.
  - **Input sanitisation**: create `server/middleware/validate.ts` with a utility that strips leading/trailing whitespace and enforces max byte length. Apply to all user-controlled text inputs:
    - Chat message content: max 2000 characters
    - Ingest text content: max 50,000 characters
    - Document title: max 200 characters
  - Do NOT install an HTML-sanitisation library — these endpoints are not rendering HTML. Simple `.trim()` + length check is sufficient.
  - **Structured chat logging**: in `server/controller/chat.controller.ts`, log after each completed chat request: `{ orgId, conversationId, latencyMs, model: 'deepseek-...' }`. Use `console.log(JSON.stringify(...))` — Hono's `logger()` middleware already logs HTTP method/path/status so don't duplicate that. Just log the chat-specific fields.
  - The existing `logger()` middleware in `server/index.ts` is `hono/logger` and is already applied globally — do not remove it.
  - Do NOT add Sentry to the server — that is a developer action requiring an account (see Pre-flight Checklist).

---

### Task 4: Frontend error boundaries

- **File targets:**
  - `client/src/app/error.tsx` — CREATE (root-level error boundary)
  - `client/src/app/dashboard/error.tsx` — CREATE (dashboard-level error boundary)
- **Assigned agent:** `frontend-ui-architect`
- **Depends on:** none
- **Gotchas:**
  - In Next.js App Router, `error.tsx` is a special file that creates a React error boundary for the route segment. It MUST be a Client Component (`"use client"` at top).
  - Check `node_modules/next/dist/docs/` for the correct `error.tsx` signature before writing — the props are `{ error: Error & { digest?: string }; reset: () => void }`.
  - The dashboard error boundary should match the dashboard's visual style (use the sidebar layout if possible, or at minimum use the same font/colors as the rest of the dashboard).
  - The root error boundary can be a simple centered card with an error message and a "Try again" button that calls `reset()`.
  - Do NOT install Sentry's Next.js SDK — that is a developer action.

---

### Task 5: Demo tenant + demo page

- **File targets (backend):**
  - `server/db/seed.ts` — MODIFY (add a "Bella Vista Restaurant" demo org with realistic menu, hours, and FAQ content; idempotent — check for existence before inserting)
- **File targets (frontend):**
  - `client/src/app/demo/page.tsx` — CREATE (demo landing page with embedded widget)
- **Assigned agent (backend part):** `backend-engineer`
- **Assigned agent (frontend part):** `frontend-ui-architect`
- **Depends on:** none (both parts are independent of each other and of other tasks)
- **Gotchas:**
  - **Seed**: `server/db/seed.ts` already exists — read it first. Add a demo org with a fixed, memorable `publicToken` (e.g., `'demo-bella-vista'`) so the demo page can embed a hardcoded widget. Make the seed idempotent using `onConflictDoNothing()` or checking `slug` uniqueness. Add 3–5 documents (restaurant menu, hours, FAQ) and insert them with status `'pending'` — the agent should NOT attempt to run the embedding pipeline from the seed; note that a developer must run the ingestion manually after seeding.
  - **Demo page**: `client/src/app/demo/page.tsx` should be a visually appealing landing page showcasing the product. Embed the widget using a `<Script>` tag (Next.js `next/script`) pointing to `/widget/launcher.js?token=demo-bella-vista`. Include a headline, short description, and a "View Dashboard" link to `/dashboard`.
  - Read the AGENTS.md Next.js note — check `node_modules/next/dist/docs/` for the correct `next/script` component API before using it.
  - The demo page should be publicly accessible (no auth required) — do not wrap it in the dashboard layout.

---

### Task 6: GitHub Actions CI pipeline

- **File targets:**
  - `.github/workflows/ci.yml` — CREATE
- **Assigned agent:** `backend-engineer`
- **Depends on:** none
- **Gotchas:**
  - The repo is a Bun monorepo. Both `client/` (Next.js) and `server/` (Bun/Hono) need to be checked.
  - CI jobs to include:
    1. **TypeScript type-check**: `cd client && bun run tsc --noEmit` and `cd server && bun run tsc --noEmit` (check `package.json` for actual script names first)
    2. **Lint**: `cd client && bun run lint` (Next.js ESLint) — check if lint script exists in `client/package.json` before adding
    3. **Server tests**: `cd server && bun test` — only if test files exist (they will after Phase 3 merge)
  - Trigger on: `push` to `main` and `pull_request` to `main`.
  - Use `actions/checkout@v4` and `oven-sh/setup-bun@v2` for Bun setup.
  - Do NOT set up a real database in CI — skip integration tests that require a DB (use `bun test --filter` or an env flag if needed, or simply skip the test job if it requires env vars that won't be set).
  - Environment secrets (DATABASE_URL, etc.) are NOT available in CI unless explicitly set in GitHub repository secrets — note this clearly in a comment in the workflow file.

---

### Task 7: E2E smoke test

- **File targets:**
  - `server/__tests__/smoke.test.ts` — CREATE
- **Assigned agent:** `backend-test-engineer`
- **Depends on:** Tasks 1, 2, 3, 4, 5, 6
- **Gotchas:**
  - Smoke test flow: sign up → ingest a short text document → poll until status is `'ready'` → call analytics summary → verify counts are non-negative.
  - Use `import { describe, it, expect, beforeAll, afterAll } from 'bun:test'`.
  - Look at `server/__tests__/org.test.ts` (added in Phase 3) for the exact test setup patterns (how auth tokens are obtained, how the app is imported).
  - This test REQUIRES a real database connection — add a guard at the top:
    ```typescript
    if (!process.env.DATABASE_URL) {
      console.warn('Skipping smoke tests: DATABASE_URL not set');
      process.exit(0);
    }
    ```
  - Do not test the widget embed or Recharts charts — those are browser-only. Smoke test the API layer only.
  - Keep the test focused: 3–5 `it()` blocks covering the critical path. Do not write exhaustive coverage here — that belongs in unit/integration tests.

---

## Dependency Graph

```
Task 1 (analytics API)         → Task 2 (analytics UI)
Task 3 (backend hardening)     — independent
Task 4 (error boundaries)      — independent
Task 5 (demo tenant/page)      — independent
Task 6 (GitHub Actions CI)     — independent
Tasks 1,2,3,4,5,6              → Task 7 (smoke test)
```

Tasks 1, 3, 4, 5, and 6 can all start in parallel. Task 2 starts after Task 1.
Task 7 runs last.

## Agent Dispatch Summary

| Agent | Tasks | Notes |
|-------|-------|-------|
| backend-engineer | 1, 3, 5 (seed part), 6 | Task 1 first (unblocks Task 2); Tasks 3, 5-seed, 6 are independent |
| frontend-ui-architect | 2, 4, 5 (demo page part) | Task 2 after Task 1; Tasks 4 and 5-demo are independent |
| db-schema-engineer | — | Schema complete; no new tables needed |
| backend-test-engineer | 7 | Last, after all implementation tasks |

## Pre-flight Checklist

- [ ] **Merge Phase 3 worktree first**: the `.worktrees/phase-3` branch must be merged to `main` before Phase 4 work begins. Agents for Phase 4 should work on `main` or a new `phase-4` worktree branched from `main` post-merge.
- [ ] **Environment variables** — all of the following must be set for local development and in Vercel:
  - `DATABASE_URL` (with pgvector extension enabled)
  - `JWT_SECRET`
  - `OPENAI_API_KEY` (embeddings)
  - `DEEPSEEK_API_KEY` (chat)
  - `CLIENT_URL` (e.g., `http://localhost:3000` for local, production URL for deploy)
- [ ] **Demo seed run**: after Task 5's seed is written, developer must run `cd server && bun run db:seed` and then manually ingest the demo documents through the dashboard (or via `POST /api/ingest`) to get embeddings generated.
- [ ] **Sentry (optional)**: if Sentry is desired, create a free Sentry account, create a Next.js project, get the DSN, and install `@sentry/nextjs`. This is a developer action — not assigned to an agent because it requires account credentials. Add `SENTRY_DSN` to environment variables.
- [ ] **Vercel deployment** (developer action, Day 27–28):
  - Connect GitHub repo to Vercel
  - Set all environment variables in Vercel dashboard
  - Set `NEXTJS_APP_DIR=client` or configure `vercel.json` for monorepo layout
  - Vercel uses Node.js by default — the Bun server may need a separate hosting solution (Railway, Fly.io) or conversion to a Vercel serverless function
- [ ] **Supabase production** (developer action): provision a separate Supabase project for production; enable pgvector; run migrations

## Architectural Decisions Required

1. **Bun server hosting on Vercel**: Vercel natively runs Next.js but does NOT run Bun servers. The `server/` (Hono/Bun) must either be:
   - Deployed separately on Railway or Fly.io (recommended — keeps the architecture clean)
   - Converted to Vercel Edge Functions or serverless functions (significant refactor)
   - The plan document was written assuming a monolith but the actual implementation already separated client/server. **Decision required before Day 27.**

2. **Analytics time-range implementation**: the `range` query parameter (`today|7d|30d`) can be handled either:
   - On the backend (API returns pre-filtered data — recommended, simpler client)
   - On the frontend (API returns all data, client filters — wastes bandwidth)
   - **Recommendation**: filter on the backend.

3. **Demo page widget token**: the demo page needs a hardcoded public token to embed the widget. Options:
   - Use a fixed token like `'demo-bella-vista'` seeded into the DB (recommended — simple)
   - Read the token from an environment variable at build time using `NEXT_PUBLIC_DEMO_TOKEN`
   - **Recommendation**: fixed token in seed, hardcoded in demo page — no env var needed for a demo.
