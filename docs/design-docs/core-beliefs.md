# Core beliefs — golden rules

Six principles from the [Splittaa harness design spec](../superpowers/specs/2026-06-01-splittaa-harness-design.md). Stable — change rarely; discuss in exec plan if amending.

---

## 1. Repository is the system of record

Architecture, security decisions, and plans live in **versioned `docs/`**, not chat threads or agent memory. If it is not in the repo, it does not exist for the next session.

---

## 2. Progressive disclosure

[AGENTS.md](../../AGENTS.md) is a **map** (~100 lines), not an encyclopedia. Deep detail lives in linked docs (`CONVEX.md`, `FRONTEND.md`, exec plans). Agents load only what the task needs.

---

## 3. Enforce invariants, not style

CI and lint enforce **boundaries**: layer imports, auth on public Convex, no unbounded `.collect()`, money in `lib/money/`. Prefer mechanical checks over subjective style debates.

---

## 4. Parse at boundaries

- **UI:** Zod + react-hook-form at submit boundaries.
- **Convex:** `v` validators on every public function’s `args`.
- **Shared rules:** `lib/money/`, `lib/validation/` — single source for split math and shapes.

Never trust client-only validation for security or money.

---

## 5. Human-owned until stable

CODEOWNERS on **auth, money, settlements, expenses** until [QUALITY_SCORE.md](../QUALITY_SCORE.md) shows **≥ B** for that domain. Agents propose; humans approve merges that affect trust.

---

## 6. Garbage collection

Regularly prune stale docs, duplicate helpers, and outdated grades. Track debt in [tech-debt-tracker.md](../exec-plans/tech-debt-tracker.md). Quality scores must reflect the codebase **today**, not at harness kickoff.

---

## Related

- [index.md](index.md) — design doc catalog
- [../PLANS.md](../PLANS.md) — how to run multi-step work
