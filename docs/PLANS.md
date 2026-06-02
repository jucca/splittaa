# Execution plans

When work spans **more than one domain** (e.g. Convex + dashboard UI + money lib), or is a **migration**, write an exec plan before coding.

---

## When required

| Requires exec plan | Skip exec plan |
|--------------------|----------------|
| Multi-file feature across app + convex | Single-file bugfix with obvious scope |
| Schema migration or index overhaul | Doc-only PR |
| Security model change | Typo / copy fix |
| TypeScript migration batch | Adding one validator to existing mutation |

---

## File locations

| State | Path |
|-------|------|
| Active | `docs/exec-plans/active/<slug>.md` |
| Done | Move to `docs/exec-plans/completed/<slug>.md` on merge |
| Tech debt | [exec-plans/tech-debt-tracker.md](exec-plans/tech-debt-tracker.md) |

Example completed plan: [harness-transform.md](exec-plans/completed/harness-transform.md)

---

## Template

Copy into `docs/exec-plans/active/<slug>.md`:

```markdown
# <Title>

**Status:** active | blocked | completed  
**Owner:** agent | human | paired  
**Spec link:** docs/superpowers/specs/... or issue URL

## Goal

One paragraph — what “done” means.

## Scope

- In scope: ...
- Out of scope: ...

## Affected domains

- [ ] convex/users
- [ ] convex/expenses
- [ ] app/(main)/...
- [ ] lib/money

## Preconditions

- [ ] AGENTS.md rules read
- [ ] QUALITY_SCORE — human review if domain < B
- [ ] Branch / worktree (if applicable)

## Plan

### Phase A — <name>
- [ ] Step 1: ...
- [ ] Step 2: ...

### Phase B — <name>
- [ ] Step 1: ...

## Verification

- [ ] `npm run verify` (when available)
- [ ] Manual: <Finnish UI flow>
- [ ] convex-test: <file>
- [ ] e2e: <spec> (if UI)

## Risks & rollback

| Risk | Mitigation |
|------|------------|
| ... | ... |

## Completion

- [ ] Docs updated (CONVEX / FRONTEND / SECURITY as needed)
- [ ] QUALITY_SCORE bumped
- [ ] Plan moved to `completed/`
```

---

## Review

- Human reviews exec plans that touch **CODEOWNERS** paths or **money/auth**.
- Agents may self-approve doc-only or test-only plans.

---

## Related

- [AGENTS.md](../AGENTS.md)
- [docs/PRODUCT_SENSE.md](PRODUCT_SENSE.md) — user context for plans
- [design-docs/core-beliefs.md](design-docs/core-beliefs.md)
