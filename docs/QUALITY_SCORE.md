# Quality score by domain

Grades reflect **agent-safe autonomy** after harness Phases 0–4 (2026-06-01).

**Scale:** A = agent may extend freely · B = agent + light human review · C = agent scaffold only · D = human-led · F = unsafe / unknown

**Target for agent autonomy:** ≥ **B** on domain before removing CODEOWNERS human gate.

---

## Scores (post Phase 4)

| Domain | Grade | Notes |
|--------|-------|-------|
| **Harness / docs** | B | `AGENTS.md`, exec plan complete, `check:docs` + CI `verify` |
| **convex/_lib/auth** | B | `requireAuth` + internal `getCurrentUser`; convex-test auth cases |
| **convex/_lib/authorize** | B | Group IDOR tests; human review on money paths |
| **convex/users** | B | `me` DTO; `store` documented in SECURITY matrix |
| **convex/expenses** | C | TS + convex-test; participant check gap; CODEOWNERS |
| **convex/groups** | B | `assertGroupMember` on reads |
| **convex/settlements** | C | TS + tests; human-owned |
| **convex/contacts** | B | createGroup + getAllContacts tested |
| **convex/dashboard** | B | Indexed personal balances |
| **convex/email** | B | Secret-gated action; Resend key in env |
| **convex/inngest** | B | Internal queries + bridge |
| **lib/money** | B | `validate-splits` + unit tests |
| **lib/validation** | B | `expenseFormSchema` + unit tests |
| **lib/config/env** | B | Zod + `instrumentation.ts` fail-fast |
| **Frontend (app + components)** | C | Typed; mostly client components |
| **components/ui** | B | shadcn primitives |
| **Testing** | B | 15 unit + 14 convex; Playwright landing smoke |
| **CI** | B | `npm run verify` in workflow |
| **Security docs** | B | SECURITY.md matrix current |

---

## How to bump a grade

| To reach | Requirements |
|----------|----------------|
| **C → B** | TypeScript strict, `requireAuth` on all public exports, basic convex-test coverage |
| **B → A** | Authorize helpers used, no hot-path `.collect()`, human sign-off on UX |
| **F → C** | Documented threat model + plan in exec-plans; minimal tests green |

---

## Review cadence

- Update on phase completion or security regressions.
- Phase 5: weekly doc-gardening — align grades with reality.

---

## Related

- [AGENTS.md](../AGENTS.md)
- [exec-plans/completed/harness-transform.md](exec-plans/completed/harness-transform.md)
- [exec-plans/tech-debt-tracker.md](exec-plans/tech-debt-tracker.md)
