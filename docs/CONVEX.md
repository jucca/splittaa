# Convex conventions

Backend patterns for Splittaa’s Convex deployment.

**Production deploy:** [DEPLOYMENT.md](DEPLOYMENT.md) — Vercel runs `npx convex deploy` via `npm run vercel-build`; set `CLERK_JWT_ISSUER_DOMAIN` and secrets on the Convex dashboard.

---

## Authentication

### `requireAuth` (public handlers)

Every public function that acts on behalf of a user must resolve the user via shared helper:

```ts
import { requireAuth } from "./_lib/auth";

export const myMutation = mutation({
  args: { /* v validators */ },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    // ...
  },
});
```

Throws `ConvexError` with Finnish messages (`UNAUTHENTICATED`, `USER_NOT_PROVISIONED`).

### `getCurrentUser` (internal only)

**Do not** expose a public query that returns the full user document.

```js
// convex/_lib/auth.ts
export const getCurrentUser = internalQuery({
  args: {},
  handler: async (ctx) => requireAuth(ctx),
});
```

Other modules call:

Prefer `requireAuth(ctx)` in the same handler. Use `ctx.runQuery(internal._lib.auth.getCurrentUser)` only when required.

### Public `users.me`

Safe DTO for the signed-in client:

```ts
export const me = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    return { id: user._id, name: user.name, imageUrl: user.imageUrl ?? null };
  },
});
```

Client: `useQuery(api.users.me)` — see [FRONTEND.md](FRONTEND.md).

### User provisioning

`users.store` mutation runs after Clerk sign-in to upsert the Convex `users` row (indexed by `tokenIdentifier`).

---

## Validators

- **All public** `args` (and `returns` when non-obvious) use `v` from `convex/values`.
- Reject unknown shapes at the boundary; keep handlers thin — logic in colocated helpers or `_lib/`.
- Prefer `v.id("tableName")` over raw strings for foreign keys.

---

## Authorization

Centralize IDOR checks in `convex/_lib/authorize.ts` (human-reviewed):

- `assertGroupMember(ctx, groupId, userId)` — throws `NOT_FOUND` / `FORBIDDEN`
- `assertGroupMembers(ctx, groupId, userIds[])` — both parties in group settlements

Use in `expenses.createExpense`, `groups.getGroupExpenses`, `settlements.createSettlement`, etc.

---

## Queries and indexes

See also [generated/db-schema.md](generated/db-schema.md) (auto-generated).

| Anti-pattern | Fix |
|--------------|-----|
| Full-table `.collect()` on `expenses` / `settlements` for dashboard balances | `convex/_lib/personal.ts` helpers |
| Group settlements without index | `settlements.by_group` |
| 1-to-1 expenses I paid | `expenses.by_user_and_group` with `groupId: undefined` |
| 1-to-1 expenses others paid (I'm in splits) | `expenses.by_group` with `groupId: undefined` + filter |

`groups` table: membership is an array — listing a user's groups still scans `groups` (acceptable while group count is small).

---

## Inngest bridge pattern

Background jobs must not use wide-open public queries.

1. **Internal queries** in `convex/inngest.js` — data access only here.
2. **Bridge actions** in `convex/inngestBridge.js` — verify `INNGEST_CONVEX_SECRET`, then `ctx.runQuery(internal.inngest.*)`.

```js
function assertInngestSecret(secret) {
  const expected = process.env.INNGEST_CONVEX_SECRET;
  if (!expected || secret !== expected) {
    throw new ConvexError({ code: "FORBIDDEN", message: "Forbidden" });
  }
}
```

Next.js route `app/api/inngest/route` registers Inngest functions that call these actions.

---

## Errors

Use `ConvexError` with stable `code` and Finnish `message` for user-facing failures. Central catalog: `convex/_lib/errors.ts` (Phase 3).

---

## Internal vs public

| Use | Export |
|-----|--------|
| Called only from Convex or scheduled jobs | `internalQuery` / `internalMutation` |
| Called from browser | `query` / `mutation` + auth |
| Called from Inngest / external automation | `action` + secret or signed webhook |

**Seed:** `seedDatabase` must be `internalMutation` with dev-only guard (Phase 0).

---

## Related

- [ARCHITECTURE.md](../ARCHITECTURE.md) — domain list
- [docs/SECURITY.md](SECURITY.md) — public API matrix (Phase 4)
- [docs/RELIABILITY.md](RELIABILITY.md) — local Convex dev
