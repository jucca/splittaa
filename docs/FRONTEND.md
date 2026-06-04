# Frontend conventions

Next.js 15 App Router patterns for Splittaa client code.

---

## Server vs client

| Route / area | Pattern |
|--------------|---------|
| `/` (landing) | Prefer Server Component when static |
| `(main)/*` | Server page shell where practical + **client feature islands** |
| Auth `(auth)/*` | Clerk-hosted UI; thin wrappers |
| Forms (expense, settlement, group) | Client components — `react-hook-form` + Convex mutations |

**Goal (Phase 3–4):** Reduce root `"use client"` pages; wrap only interactive subtrees. Dashboard and lists become islands inside a server layout.

---

## Data fetching — canonical pattern

Use the **Convex React** hooks from `convex/react`:

```tsx
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

const user = useQuery(api.users.me);
const createExpense = useMutation(api.expenses.create);
```

- Prefer **`useQuery`** with loading UI or **React Suspense** boundaries (Phase 4 polish).
- Handle `undefined` while loading; use skeletons consistent with shadcn.

### Deprecated: `useConvexQuery`

`hooks/use-convex-query.js` duplicates Convex loading state into local React state. **Do not use in new code.**

| Legacy | Replacement |
|--------|-------------|
| `useConvexQuery(api.foo, args)` | `useQuery(api.foo, args)` |
| `useConvexMutation(api.bar)` | `useMutation(api.bar)` |

Migration: remove wrapper import; drop manual `isLoading` where Suspense or `undefined` check suffices. Existing usages listed in harness plan Phase 2–4.

---

## Providers

- **ClerkProvider** + **ConvexProviderWithClerk** in root layout — auth token forwarded to Convex.
- **Toasts:** `sonner` for mutation errors; map known `ConvexError` codes via `lib/i18n/convex-errors.ts` for the active locale.
- **i18n:** `useTranslations('namespace')` in client islands; `getTranslations` in Server Components. Locale from cookie via `i18n/request.ts` (`localePrefix: never` — do not add `createIntlMiddleware`; it rewrites `/` to `/fi` and causes 404). Switch locale with `useSwitchLocale()` (cookie + refresh; strips stray `/en` or `/fi` from the URL). Legacy `/en/...` bookmarks redirect to the real path in `middleware.ts` and set the locale cookie. Language switcher: `data-testid="language-switcher"`. Parity check: `npm run check:i18n`.

---

## Forms

- **react-hook-form** + **Zod** resolvers for client validation before mutation.
- Submit disabled while mutation in flight; show field-level errors in Finnish.
- Server-side validation still required in Convex (`v` + business rules).

---

## Components layout (target)

```
components/
  ui/           # shadcn only — no Convex, no feature imports
  layout/       # header, providers shell
  features/     # expenses, groups, settlements, contacts, dashboard
```

Consolidate `app/**/components/*` into `components/features/*` during Phase 3.

---

## E2E stability (planned)

Playwright tests (Phase 4) need stable selectors. Add **`data-testid`** on:

| Flow | Suggested ids |
|------|-----------------|
| Sign-in / dashboard entry | `nav-dashboard`, `auth-sign-in` |
| New expense | `expense-form`, `expense-submit`, `split-selector` |
| Settlement | `settlement-form`, `settlement-submit` |
| Group / contacts | `group-create`, `contact-search` |
| Activity spending (`/toiminta`) | `spending-period-week`, `spending-period-month`, `spending-period-year`, `spending-total`, `spending-chart-time`, `spending-chart-category` |

Convention: kebab-case, prefix with feature (`expense-`, `settlement-`). Do not rely on visible Finnish text alone (copy may change).

---

## Styling

- Tailwind utility classes; `cn()` from `lib/utils` for variants.
- Icons: `lucide-react` — tree-shake imports per icon.
- Avoid inline styles except dynamic values (charts).

---

## Related

- [ARCHITECTURE.md](../ARCHITECTURE.md) — import rules
- [docs/CONVEX.md](CONVEX.md) — API surface
- [docs/DESIGN.md](DESIGN.md) — Finnish UI and a11y
