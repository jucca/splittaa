# Splittaa Harness Transformation — Design Spec

**Status:** Approved (brainstorming 2026-06-01)  
**Scope:** Full harness engineering preparation for Next.js 15 + Convex + Clerk  
**Reference:** [Harness Engineering (OpenAI, Feb 2026)](https://openai.com/index/harness-engineering/)

## Decisions summary

| Decision | Choice |
|----------|--------|
| Initiative scope | Full harness transformation (not security-only) |
| Language | TypeScript end-to-end, `strict: true` |
| Workflow | Hybrid: agents → scaffold/docs/tests/refactors; humans → UX + auth/money until stable |
| Verification (Phase 1) | Full stack: Vitest + convex-test + Playwright E2E + visual snapshots |
| Approach | Depth-first phases (Phase 0–5), not big-bang |

---

## 1. Vision and principles

### Vision

Transform Splittaa into an **agent-legible**, **mechanically enforced** codebase where knowledge lives in versioned `docs/`, boundaries are enforced by TypeScript and CI, and agents implement features via progressive disclosure while humans retain judgment on UX and financial/auth correctness.

### Golden rules

1. **Repository is the system of record** — architecture, security, and plans live in `docs/`, not chat.
2. **Progressive disclosure** — `AGENTS.md` (~100 lines) is a map, not an encyclopedia.
3. **Enforce invariants, not style** — layer dependencies, auth on public Convex functions, boundary validation.
4. **Parse at boundaries** — Zod (UI) and Convex `v` (API); shared logic in `lib/money/`.
5. **Human-owned until stable** — CODEOWNERS on auth/money paths until `QUALITY_SCORE` ≥ B.
6. **Garbage collection** — regular doc-gardening against `QUALITY_SCORE.md` and tech-debt tracker.

### Phased roadmap

| Phase | Focus | Human | Agent |
|-------|--------|-------|-------|
| **0** (days) | Security hotfixes | Review | internalQuery auth, lock seed/inngest, `.gitignore` |
| **1** (week 1) | Harness scaffold + CI | Product intent | `AGENTS.md`, `docs/*`, GitHub Actions, test skeleton |
| **2** (weeks 2–3) | TypeScript migration | UX on expenses/settlements | convex → lib → components → app |
| **3** (weeks 3–4) | Architecture layers | Auth/money modules | Domain folders, dependency rules, schema doc gen |
| **4** (week 5) | Full verification | Visual/UX acceptance | Vitest, convex-test, Playwright, screenshots |
| **5** (ongoing) | Agent operations | Prioritization | Doc-gardening, exec plans, quality grades |

---

## 2. Architecture

### 2.1 Two planes

**Next.js app plane** — dependency direction: Pages → Features → UI; Lib has no upward imports.

**Convex data plane** — Public API → `_lib/auth` + `_lib/authorize`; internal functions for cross-calls only.

**Hard rules (CI):**

- `convex/` never imports `app/` or `components/`.
- `app/` never imports `convex/_lib/` or `internal.*`.
- `components/ui/` never imports features or Convex.
- Money math only in `lib/money/` (unit tested).

### 2.2 Target folder structure

```
AGENTS.md
ARCHITECTURE.md
app/                          # pages/layouts (Server where possible)
components/
  ui/                         # shadcn only
  layout/                     # header, providers
  features/{expenses,groups,...}
lib/
  config/env.ts
  money/
  validation/
  inngest/
hooks/
convex/
  schema.ts
  _lib/{auth,authorize,errors}.ts
  {users,expenses,groups,settlements,contacts,dashboard,email,inngest}/
docs/                         # harness knowledge base
tests/{unit,convex,e2e}/
scripts/
```

Keep `app/` at repo root (no `src/` migration). Consolidate `app/**/components/` into `components/features/`.

### 2.3 Rendering strategy

| Route | Pattern |
|-------|---------|
| `/` | Server Component |
| `(main)/*` | Server page shell + client feature islands |
| Forms | Client (`react-hook-form` + Convex mutations) |

Phase 4 optional: `convex/nextjs` `preloadQuery` for dashboard streaming.

**Deprecate** `useConvexQuery` state-duplication pattern; document canonical `useQuery` + Suspense in `docs/FRONTEND.md`.

### 2.4 Convex domains

- `getCurrentUser` → `internalQuery` in `convex/_lib/auth.ts`.
- Public `users.me` returns safe DTO only.
- `seedDatabase` → `internalMutation` + dev-only guard.
- Inngest data access → `internalQuery` only.
- Replace dashboard `.collect()` with indexed queries.

### 2.5 TypeScript migration order

1. `convex/`  
2. `lib/config`, `lib/money`, `lib/validation`  
3. `components/ui`, `components/layout`  
4. `components/features/*` (human review: expenses, settlements)  
5. `app/**`  
6. `middleware.ts`, `next.config.ts`

### 2.6 Enforcement tools

- `tsc --noEmit` (strict)
- ESLint + `@convex-dev/eslint-plugin`
- `dependency-cruiser` or `eslint-plugin-boundaries`
- Custom rules: max file length ~300, no `any`
- `scripts/check-docs.ts`, `scripts/check-convex-auth.ts`
- `CODEOWNERS` on money/auth paths

---

## 3. Security and data protection

### 3.1 Threat model highlights

| Risk | Mitigation |
|------|------------|
| Unauthenticated Convex access | `requireAuth()` on all public functions |
| IDOR on expenses/groups | `convex/_lib/authorize.ts` helpers |
| Public seed/inngest queries | internal-only + env guards |
| Secret leak | `.gitignore` `.env*`; `.env.example`; gitleaks in CI |
| XSS | CSP baseline in `next.config.ts` |

### 3.2 Authorization helpers (human-reviewed)

- `authorize.groupMember`
- `authorize.expenseParticipant`
- `authorize.settlementParty`
- `authorize.canCreateExpense`

### 3.3 Phase 0 hotfixes

1. Fix `.gitignore`; rotate keys if `.env` was ever committed.
2. `getCurrentUser` → internal.
3. `seedDatabase` → internal + guard.
4. Inngest queries → internal.
5. Audit all public Convex exports → `docs/SECURITY.md` matrix.
6. Review `email.sendEmail` authorization.

### 3.4 Environment

- `lib/config/env.ts` — Zod validation server/client env.
- Fail fast on missing/invalid env at startup.

### 3.5 HTTP headers

`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, CSP (report-only → enforce per Clerk/Convex docs).

---

## 4. Testing and CI

### 4.1 Pyramid

| Layer | Tool | Owner |
|-------|------|-------|
| Unit | Vitest — `lib/money`, `lib/validation` | Agent |
| Integration | convex-test — auth, authz, mutations | Agent + human on money |
| E2E | Playwright — smoke flows | Agent scaffold, human selectors |
| Visual | Playwright screenshots — `/`, dashboard, expense form | Human approves `visual-ok` |

### 4.2 Phase 1 minimum

- ≥15 unit tests (money/validation)
- ≥10 convex-test cases
- 3+ Playwright smoke tests with auth fixture
- 3 visual baselines
- CI: typecheck, lint, unit, convex, e2e, check-docs

### 4.3 Scripts

```
pnpm verify     # typecheck + lint + test:unit + test:convex
pnpm test:e2e   # playwright
pnpm check:docs
```

### 4.4 Test data

- `internal.seed.seedTestFixtures` for E2E (separate from dev seed).
- No E2E against production.

---

## 5. Harness and agent operations

### 5.1 `AGENTS.md`

~100 lines: what Splittaa is, hard rules, commands, doc map, ownership split. CI enforces max length and valid links.

### 5.2 `docs/` catalog

- `DESIGN.md`, `FRONTEND.md`, `CONVEX.md`, `SECURITY.md`, `RELIABILITY.md`
- `QUALITY_SCORE.md`, `PLANS.md`, `PRODUCT_SENSE.md`
- `design-docs/`, `exec-plans/{active,completed}/`, `generated/db-schema.md`, `references/`

### 5.3 Exec plans

Required for multi-domain features and migrations. Template in `docs/PLANS.md`. Move to `completed/` on merge.

### 5.4 Doc-gardening

Weekly: stale docs, schema drift, duplicate helpers, quality grades. Golden principles in `design-docs/core-beliefs.md`.

### 5.5 Cursor rules

- `splittaa-architecture.mdc` — imports
- `splittaa-convex.mdc` — auth, validators
- `splittaa-harness.mdc` — AGENTS.md first

### 5.6 PR labels

`agent-authored`, `needs-human`, `visual-ok`

---

## 6. Performance, reliability, and rollout

### 6.1 Performance targets (Phase 3–4)

| Area | Current issue | Target |
|------|---------------|--------|
| Dashboard queries | Full table `.collect()` | Indexed queries; paginate where needed |
| Client bundle | All pages `"use client"` | Server shells; code-split feature islands |
| Images/fonts | Default | `next/image`, `optimizePackageImports` for lucide/recharts |
| Convex | Missing indexes | Add indexes per query pattern in `docs/CONVEX.md` |

### 6.2 Reliability

- `docs/RELIABILITY.md`: local dev, CI boot, Clerk test auth, flake policy (retry once in CI, fix root cause).
- `data-testid` on critical UI for stable E2E.
- Structured `ConvexError` codes in `convex/_lib/errors.ts`.

### 6.3 Error handling

| Layer | Pattern |
|-------|---------|
| Convex | `ConvexError({ code, message })` — Finnish user messages in handler |
| Client | Toast via sonner; map known codes |
| Forms | Zod + react-hook-form field errors |

### 6.4 Rollout timeline (indicative)

| Week | Deliverable |
|------|-------------|
| 0 | Phase 0 security merged |
| 1 | AGENTS.md, docs skeleton, CI verify job, `.env.example` |
| 2–3 | Convex + lib TypeScript; domain split started |
| 3–4 | Features + app TS; layer lint; authorize helpers |
| 5 | Full test pyramid green; QUALITY_SCORE baseline |
| 6+ | Doc-gardening automation; optional preloadQuery RSC |

### 6.5 Success criteria (initiative complete)

- [ ] All source `.ts`/`.tsx` strict, no `.js` in app/convex/lib/components
- [ ] `pnpm verify` green on main
- [ ] Public Convex API fully listed in `docs/SECURITY.md` with auth verified
- [ ] No public unauthenticated mutations; no full-table scans in hot paths
- [ ] Agent can follow `AGENTS.md` to add a documented feature with tests
- [ ] Human CODEOWNERS enforced on money/auth

---

## 7. Out of scope (Phase 1)

- Integer-cents currency migration
- Full observability stack per git worktree (OpenAI-scale)
- Chromatic (optional later; Playwright screenshots first)
- i18n beyond existing Finnish UI

---

## 8. Next step

After spec approval: invoke **writing-plans** skill to produce phased implementation plan with bite-sized tasks and verification steps per phase.
