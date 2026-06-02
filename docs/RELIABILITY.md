# Reliability and local development

How to run Splittaa safely and repeatably on a developer machine.

---

## Local development

Run **two processes**:

```bash
# Terminal 1
npm run dev

# Terminal 2
npx convex dev
```

- Next.js: http://localhost:3000 (default)
- Convex dashboard: linked from `npx convex dev` output
- Changes to `convex/` sync automatically when Convex dev is running

First-time setup:

```bash
cp .env.example .env
# Fill CONVEX_*, CLERK_*, and optional RESEND/GEMINI/INNGEST keys
npm install
npx convex dev   # follow prompts to create/link deployment
```

---

## Environment variables

Source of truth: [`.env.example`](../.env.example) at repo root.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_CONVEX_URL` | Browser Convex client |
| `CONVEX_DEPLOYMENT` | CLI deployment slug |
| `NEXT_PUBLIC_CLERK_*` / `CLERK_SECRET_KEY` | Auth |
| `CLERK_JWT_ISSUER_DOMAIN` | Convex auth config |
| `RESEND_API_KEY` | Transactional email |
| `GEMINI_API_KEY` | Optional AI insights |
| `INNGEST_*` / `INNGEST_CONVEX_SECRET` | Background jobs + bridge |

**Never commit** `.env` — only `.env.example` is tracked. Rotate keys if `.env` was ever committed.

`lib/config/env.ts` validates env at startup via `instrumentation.ts` (production fail-fast).

---

## Clerk test auth (E2E)

Playwright specs live in `tests/e2e/`.

| Spec | Auth |
|------|------|
| `landing.spec.ts` | None — runs in CI without secrets |
| `dashboard.spec.ts`, `expense-create.spec.ts` | Skipped unless `E2E_CLERK_STORAGE` points to a saved session |

**Local authenticated runs:**

```bash
# Once: sign in and save session
npx playwright codegen --save-storage=tests/e2e/.auth/user.json http://localhost:3000

# Run gated specs
E2E_CLERK_STORAGE=tests/e2e/.auth/user.json npm run test:e2e
```

Optional Convex fixtures: `ALLOW_DEV_SEED=true` then `npx convex run seedTest:seedTestFixtures`.

Add `tests/e2e/.auth/` to `.gitignore` if storing real sessions locally.

---

## Production (Vercel)

Deploy the Next.js app to Vercel with Convex deployed during build. Full checklist, env vars, Clerk/Inngest URLs:

**[DEPLOYMENT.md](DEPLOYMENT.md)**

---

## CI

Workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)

| Job | Steps |
|-----|--------|
| `verify` | `npm run verify` (lint, docs, schema doc, layers, typecheck, unit, convex) |
| `e2e` | Commented — enable when `PLAYWRIGHT_BASE_URL` + Clerk test storage or testing tokens are in GitHub secrets |

Local pre-push: `npm run verify`

**npm:** `.npmrc` sets `legacy-peer-deps=true` (date-fns vs react-day-picker peer conflict).

**GitHub secrets (for future e2e):** `NEXT_PUBLIC_CONVEX_URL`, Clerk test credentials, `INNGEST_CONVEX_SECRET`, Convex deploy key — see [SECURITY.md](SECURITY.md).

---

## Flake policy

- CI: **one retry** max for e2e; if still failing, fix root cause (timing, selector, data).
- Prefer `data-testid` over text selectors — see [FRONTEND.md](FRONTEND.md).
- No E2E against production deployments.

---

## Health checks before claiming “done”

1. `npm run dev` + `npx convex dev` — sign in, load dashboard.
2. When available: `npm run verify` green.
3. Convex dashboard — no function errors on exercised paths.

---

## Related

- [AGENTS.md](../AGENTS.md) — commands
- [docs/CONVEX.md](CONVEX.md) — backend errors
- [DEPLOYMENT.md](DEPLOYMENT.md) — Vercel production
- [DOC_GARDENING.md](DOC_GARDENING.md) — weekly doc maintenance
- [exec-plans/active/phase-5-operations.md](exec-plans/active/phase-5-operations.md) — Phase 5 tracker
- [exec-plans/completed/harness-transform.md](exec-plans/completed/harness-transform.md) — harness initiative summary
