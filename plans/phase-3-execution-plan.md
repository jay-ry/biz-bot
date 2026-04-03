# Phase 3 Execution Plan — Embeddable Widget

**Generated:** 2026-04-03 (revised after full codebase inspection)
**Phase status:** IN PROGRESS
**Estimated tasks remaining:** 5

## Current State Summary

The widget is further along than initially assessed. The architecture uses an **iframe approach**
rather than Shadow DOM: `client/public/widget/launcher.js` is a self-invoking vanilla JS script
that injects a floating button + iframe pointing to the Next.js `/widget` route. That route renders
`ChatWidgetLoader` → `ChatWidget` which uses CopilotKit SDK to stream responses through
`POST /api/copilotkit` backed by a DeepSeek RAG adapter. The `GET /api/widget-config` endpoint
exists and serves `{ botName, brandColor, orgName }` with `CORS: *`. The `organizations` table
has `botName`, `brandColor`, `systemPrompt`, and `allowedOrigins` columns.

What's missing: the launcher button uses a hardcoded brand color instead of the config API value;
there is no backend endpoint to read/update org settings; and the dashboard is missing the
Customize and Embed pages.

## Exit Criterion

A fully working embeddable widget: paste the script tag on any HTML page and get a functional
streaming chatbot using the org's content, with the correct brand color; plus dashboard pages
for customization and embed code retrieval.

## Task Breakdown

---

### Task 1: Apply dynamic brand color in launcher.js

- **File targets:**
  - `client/public/widget/launcher.js` — MODIFY
- **Assigned agent:** `backend-engineer`
- **Depends on:** none
- **Gotchas:**
  - The button background is currently hardcoded to `'#550000'`. After fetching
    `/api/widget-config?token=...`, apply `config.brandColor` to the button's background.
  - The fetch must complete before the button is shown to avoid a color flash. Keep the
    button hidden (`visibility: hidden`) until the config loads, then reveal it.
  - Retain the hover color logic: on open, use a slightly darker shade. A simple approach
    is to use the brand color for closed state and set `filter: brightness(0.85)` on hover
    instead of a hardcoded darker hex.
  - Must remain vanilla JS — no TypeScript, no imports, no module syntax. File must keep
    its self-invoking IIFE structure.
  - Derive `apiUrl` from `script.dataset.api` OR from the script's own origin (already done).
  - The config fetch URL pattern already in use: `widgetOrigin + '/api/widget-config?token=' + token`.

---

### Task 2: Backend org settings API

- **File targets:**
  - `server/routes/org.ts` — CREATE
  - `server/controller/org.controller.ts` — CREATE
  - `server/services/org.service.ts` — CREATE
  - `server/index.ts` — WIRE IN (`app.route('/api/org', orgRoutes)`, protected by authMiddleware)
- **Assigned agent:** `backend-engineer`
- **Depends on:** none
- **Gotchas:**
  - Endpoints:
    - `GET /api/org` — return current org settings. Response shape:
      ```json
      { "id": "...", "name": "...", "publicToken": "...", "botName": "...", "brandColor": "...", "systemPrompt": "...", "allowedOrigins": [...] }
      ```
    - `PATCH /api/org` — update writable fields: `botName`, `brandColor`, `systemPrompt`,
      `allowedOrigins`. Return the updated org.
  - Both routes must use `authMiddleware`. Org ID comes from JWT payload via `c.get('jwtPayload').orgId`.
  - Input validation with Zod: `botName` (string, max 60), `brandColor` (string matching `#[0-9a-fA-F]{3,6}`),
    `systemPrompt` (string, max 2000, optional), `allowedOrigins` (array of strings, optional).
  - `allowedOrigins` input is a string array; pass it directly to Drizzle (the schema column is `text('allowed_origins').array()`).
  - Look at `server/middleware/auth.ts` and the JWT payload shape before implementing — the
    controller needs to know the exact field name (`orgId` vs `org_id`) in the payload.
  - Wire in with `authMiddleware` already imported in `server/index.ts` — check how `ingestRoutes`
    is protected there and mirror that pattern.

---

### Task 3: Dashboard customize page

- **File targets:**
  - `client/src/app/dashboard/customize/page.tsx` — CREATE
  - `client/src/services/org.ts` — CREATE
  - `client/src/hooks/use-org.ts` — CREATE
- **Assigned agent:** `frontend-ui-architect`
- **Depends on:** Task 2
- **Gotchas:**
  - Read `client/src/app/dashboard/content/page.tsx` and the existing hook/service files
    before implementing — follow the exact same patterns for API calls and state management.
  - Form fields: Bot name (text input), Brand color (hex input + color swatch preview),
    System prompt (textarea), Allowed origins (textarea, one origin per line — convert to/from
    string array when calling the API).
  - The color swatch should update live as the user types a valid hex. Show it as a small
    rounded square next to the hex input.
  - On save: call `PATCH /api/org`, show success/error inline. Use shadcn/ui `Card`, `Input`,
    `Button`, `Textarea`, `Label` components (already installed).
  - Auth token: follow the pattern in `client/src/services/ingest.ts` — it likely reads
    from localStorage or a cookie. Don't invent a new auth mechanism.
  - The page should show the current values from `GET /api/org` on load.

---

### Task 4: Dashboard embed page

- **File targets:**
  - `client/src/app/dashboard/embed/page.tsx` — CREATE
- **Assigned agent:** `frontend-ui-architect`
- **Depends on:** Task 2 (to read publicToken from GET /api/org)
- **Gotchas:**
  - The correct embed snippet is (NOT `/widget.js` — the actual file is at `/widget/launcher.js`):
    ```html
    <script src="https://YOUR_DOMAIN/widget/launcher.js?token=ORG_PUBLIC_TOKEN" defer></script>
    ```
  - Fetch `GET /api/org` to get `publicToken` and substitute it into the snippet.
  - Show the snippet in a `<pre>` or `<code>` block with a "Copy to clipboard" button.
  - Include a note that `YOUR_DOMAIN` should be replaced with the actual deployment URL.
  - Check if the sidebar in `client/src/components/dashboard/sidebar.tsx` already has an
    "Embed" nav link pointing to `/dashboard/embed` — add it if missing.
  - No live preview iframe needed (that would require knowing the public URL at build time).
    Keep it simple: show the snippet and copy button.
  - Follow the same layout/style conventions as the other dashboard pages.

---

### Task 5: End-to-end tests for org API

- **File targets:**
  - `server/__tests__/org.test.ts` — CREATE
- **Assigned agent:** `backend-test-engineer`
- **Depends on:** Tasks 1, 2, 3, 4
- **Gotchas:**
  - Test `GET /api/org`: authenticated request returns org data; 401 without token.
  - Test `PATCH /api/org`: updates `botName` and `brandColor`; validates input shape
    (bad hex rejected); 401 without token.
  - Look at the existing test setup (if any) and the server's testing configuration
    before writing tests. Check `package.json` for the test command and any test helpers.
  - The test runner is Bun — use `import { describe, it, expect } from 'bun:test'`.
  - Prefer integration tests that hit the actual Hono app with a real DB connection
    over mocked tests. Look at how `server/db/connection.ts` is structured to understand
    if there's a test DB or if the dev DB is reused.

---

## Dependency Graph

```
Task 1 (launcher.js brand color)  — independent
Task 2 (org API)                  — independent
Task 2 → Task 3 (customize page)
Task 2 → Task 4 (embed page)
Tasks 1,2,3,4 → Task 5 (tests)
```

Tasks 1 and 2 can be dispatched first (parallel in principle, sequential in this session).
Tasks 3 and 4 start after Task 2 completes.

## Agent Dispatch Summary

| Agent | Tasks | Notes |
|-------|-------|-------|
| backend-engineer | 1, 2 | Tasks are independent; do 1 then 2 |
| frontend-ui-architect | 3, 4 | After Task 2; can do 3 then 4 sequentially |
| db-schema-engineer | — | Schema already complete |
| backend-test-engineer | 5 | Last, after all implementation tasks |

## Pre-flight Checklist

- [ ] `DEEPSEEK_API_KEY` set (chat uses DeepSeek, not Claude)
- [ ] `OPENAI_API_KEY` set (embeddings use OpenAI `text-embedding-3-small`)
- [ ] `JWT_SECRET` set
- [ ] `DATABASE_URL` set with pgvector extension enabled
- [ ] Working directory for agents: `/home/jayry/projects/local-biz-chatbot/.worktrees/phase-3`

## Architectural Decisions (Already Resolved)

1. **Widget approach**: iframe (not Shadow DOM). `launcher.js` creates iframe pointing to
   `/widget?token=...`. The React widget page handles the chat UI via CopilotKit.

2. **Widget script path**: `client/public/widget/launcher.js` → served at `/widget/launcher.js`.
   Embed snippet uses this path.

3. **Chat backend**: CopilotKit route (`/api/copilotkit`) backed by DeepSeek RAG adapter.
   The `/api/chat` SSE endpoint exists but is not used by the current widget.

4. **allowedOrigins default**: Allow all when null/empty (permissive for new orgs).
