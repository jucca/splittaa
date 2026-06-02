# Design principles

Product and UX constraints for Splittaa. Agents implement features; humans judge feel and financial trust.

---

## Product principles

1. **Clarity over cleverness** — Users should see who owes whom without mental math. Balances and settlements are first-class.
2. **Low friction capture** — Adding an expense or settlement should take seconds; sensible defaults (current user, last group).
3. **Trust through consistency** — Same terms everywhere (Finnish copy, same currency display, same error tone).
4. **Groups are optional context** — Person-to-person and group flows share patterns; do not fork unrelated UIs.
5. **Fail loudly, recover gently** — Errors explain what went wrong in Finnish; actions are reversible where safe (e.g. delete expense with confirm).

---

## Finnish UI

- All **user-visible** strings: Finnish (labels, toasts, validation, `ConvexError` messages surfaced to UI).
- **Code and docs:** English (identifiers, comments, agent docs).
- **Dates and numbers:** Finnish locale conventions where formatted (`fi-FI`).
- **No i18n framework** in Phase 1 — single locale by convention, not translation files.

---

## Accessibility baseline

Target **WCAG 2.1 AA** for core flows (auth, dashboard, add expense, settle).

| Area | Expectation |
|------|-------------|
| Keyboard | All primary actions reachable; modals trap focus and restore on close |
| Focus | Visible focus rings on interactive controls (shadcn defaults) |
| Labels | Form fields have associated `<Label>` or `aria-label` |
| Color | Do not rely on color alone for balance direction (owe vs owed) |
| Motion | Respect `prefers-reduced-motion` for non-essential animation |
| E2E | Stable `data-testid` on critical controls (see `docs/FRONTEND.md`) |

New UI should use semantic HTML and Radix primitives already in `components/ui/`.

---

## Visual system

- **Tailwind 4** + shadcn-style components; theme via `next-themes` where used.
- **Density:** Comfortable for mobile-first; main flows usable on narrow viewports.
- **Charts:** Recharts on dashboard — provide text summary or table fallback where possible.

---

## Out of scope (harness Phase 1)

- Integer-cents currency migration
- Full design system in Figma sync
- Additional locales beyond Finnish

See [design-docs/core-beliefs.md](design-docs/core-beliefs.md) for engineering golden rules.
