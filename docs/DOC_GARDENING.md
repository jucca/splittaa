# Doc gardening (Phase 5)

Keep harness docs aligned with the codebase on a regular cadence.

---

## Weekly checklist (≈15 min)

1. Run `npm run generate:docs` — regenerates `docs/generated/db-schema.md` and runs doc checks.
2. Skim [QUALITY_SCORE.md](./QUALITY_SCORE.md) — downgrade domains if regressions shipped.
3. If Convex schema changed, confirm [SECURITY.md](./SECURITY.md) public API table still matches exports.
4. Close or update [exec-plans/active/](./exec-plans/active/) items; move finished plans to `completed/`.

---

## Commands

| Command | Purpose |
|---------|---------|
| `npm run generate:docs` | Schema doc + `check:docs` + `check:schema-doc` |
| `npm run check:docs` | `AGENTS.md` links and required files |
| `npm run verify` | Full quality gate before merge |

---

## Agent PRs

Agents may open small PRs that only:

- Refresh generated schema doc
- Fix broken links in `AGENTS.md`
- Update grades in `QUALITY_SCORE.md` with evidence from `verify`

Do not bundle product features with doc-gardening PRs.

---

## Related

- [PLANS.md](./PLANS.md) — when to write exec plans
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Vercel / Convex production
