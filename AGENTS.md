# Splittaa — Agent entry map

**Splittaa** is a Finnish-language expense-splitting app (Splitwise-style): shared expenses, groups, settlements, and contacts. Stack: **Next.js 15**, **React 19**, **Convex** (real-time backend), **Clerk** (auth), **Tailwind/shadcn**, **Inngest** (background jobs). UI copy and errors are in **Finnish**.

Full harness design: [docs/superpowers/specs/2026-06-01-splittaa-harness-design.md](docs/superpowers/specs/2026-06-01-splittaa-harness-design.md)

---

## Before you touch code

1. Read **[ARCHITECTURE.md](ARCHITECTURE.md)** — two planes, domains, import rules.
2. Open the relevant doc from the table below (Convex change → `docs/CONVEX.md`, UI → `docs/FRONTEND.md`, etc.).
3. For multi-domain work, start an exec plan per **[docs/PLANS.md](docs/PLANS.md)** under `docs/exec-plans/active/`.
4. Check **[docs/QUALITY_SCORE.md](docs/QUALITY_SCORE.md)** — human review required where grade is below **B**.

---

## Hard rules (non-negotiable)

| Rule | Detail |
|------|--------|
| **Auth on public Convex** | Every public `query` / `mutation` / `action` must call `requireAuth()` (or equivalent) unless explicitly documented as public in `docs/SECURITY.md` (Phase 4). |
| **No full-table scans** | Do not use `.collect()` on unbounded tables in hot paths; use indexes and pagination. |
| **Money math** | When `lib/money/` exists, all split/balance arithmetic lives there with unit tests — not inline in components or Convex handlers. |
| **Layer imports** | `convex/` never imports `app/` or `components/`. `app/` never imports `convex/_lib/` or `internal.*`. `components/ui/` never imports features or Convex. |
| **Parse at boundaries** | Convex: `v` validators on all public args. UI forms: Zod + react-hook-form. |
| **Internal auth** | Resolve the signed-in user via `internal._lib.auth.getCurrentUser` — not a public query. |
| **Human-owned paths** | Until `QUALITY_SCORE` ≥ B on a domain, treat CODEOWNERS paths as human-reviewed (see Ownership). |

---

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server (Turbopack) |
| `npx convex dev` | Convex sync + local backend (run alongside Next) |
| `npm run lint` | ESLint (Next config) |
| `npm run verify` | Lint + doc checks + typecheck + unit tests |
| `npm run test:e2e` | Playwright — **Phase 4** |
| `npm run check:docs` | `AGENTS.md` links and required docs |
| `npm run generate:docs` | Schema doc regen + doc checks (weekly) |
| `npm run vercel-build` | Convex deploy + Next build (Vercel) |
| `npm run typecheck` | `tsc --noEmit` (strict; JS allowed during migration) |

Typical local session: two terminals — `npm run dev` and `npx convex dev`. Copy env from `.env.example` (see `docs/RELIABILITY.md`).

---

## Doc map

| Doc | Use when |
|-----|----------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Layers, domains, dependency direction |
| [docs/DESIGN.md](docs/DESIGN.md) | Product principles, Finnish UI, a11y |
| [docs/FRONTEND.md](docs/FRONTEND.md) | Client islands, `useQuery`, E2E hooks |
| [docs/CONVEX.md](docs/CONVEX.md) | Auth, validators, Inngest bridge |
| [docs/RELIABILITY.md](docs/RELIABILITY.md) | Local dev, env, CI, flakes |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Vercel + Convex + Clerk production |
| [docs/DOC_GARDENING.md](docs/DOC_GARDENING.md) | Weekly doc maintenance |
| [docs/PLANS.md](docs/PLANS.md) | Exec plan template (required for multi-domain) |
| [docs/PRODUCT_SENSE.md](docs/PRODUCT_SENSE.md) | User journeys |
| [docs/QUALITY_SCORE.md](docs/QUALITY_SCORE.md) | Per-domain grades |
| [docs/design-docs/](docs/design-docs/index.md) | Golden rules, design index |
| [docs/exec-plans/](docs/exec-plans/tech-debt-tracker.md) | Active work, tech debt |
| [docs/SECURITY.md](docs/SECURITY.md) | Threat model + public API matrix |
| [docs/superpowers/plans/2026-06-01-splittaa-harness.md](docs/superpowers/plans/2026-06-01-splittaa-harness.md) | Phased implementation checklist |

---

## Ownership: agent vs human

| Owner | Scope |
|-------|--------|
| **Agent** | Docs scaffold, tests, refactors, non-money Convex domains, `components/ui`, lint/CI, indexed query fixes |
| **Human** | UX polish, visual acceptance, auth/money correctness until stable |
| **CODEOWNERS** | `convex/expenses*`, `convex/settlements*`, `convex/_lib/auth.js`, `lib/money/` |

When unsure: prefer a small PR + `needs-human` label over guessing split logic or authorization.

---

## Active initiative

Phase 5 (operations + Vercel): [docs/exec-plans/active/phase-5-operations.md](docs/exec-plans/active/phase-5-operations.md)

Harness transformation (completed): [docs/exec-plans/completed/harness-transform.md](docs/exec-plans/completed/harness-transform.md)
