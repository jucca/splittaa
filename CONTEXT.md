# Splittaa — domain glossary

Short canonical terms for balance and expense semantics. See [ARCHITECTURE.md](ARCHITECTURE.md) for layers.

---

## Balances

| Term | Meaning |
|------|---------|
| **Globaali saldo** | Net debt between two users across all contexts. **Computed at read time** from expenses and settlements (`convex/_lib/globalBalance.ts`). Shown on dashboard (Saldotiedot), person view (`/person/[id]`), and personal settlements. |
| **autoNetBalances** | User setting (default **on**). When on, shared expenses (personal and group) can reduce visible debt in global views (Splitwise-style netting). When off, only direct debts and personal settlements count — paying a shared expense does not automatically reduce debt; group expenses are excluded from global balance. Group page balance is unchanged either way. |
| **Ryhmäsaldo** | Net debt between two members **within one group**. Stored with `scopeType: "group"` and `scopeGroupId`. Shown on the group page only. |
| **Parivelka** | Directed amount one user owes another (`userId` owes `counterpartyUserId` when `amount > 0`). |

Group expenses write only to `group` scope; global views aggregate group + personal scopes automatically. Personal-only expenses update personal scope only.

---

## Expenses

| Term | Meaning |
|------|---------|
| **Henkilökohtainen kulu** | Expense with no `groupId`. Visible on person view between participants. |
| **Ryhmäkulu** | Expense with `groupId`. Listed on group page; pairwise effect also reflected in global saldo. |

---

## Onboarding vs guide

| Term | Meaning |
|------|---------|
| **Profiilin onboarding** | Mandatory display name + username at `/profiili/luo` (`profileCompletedAt`). |
| **Apuri** | Optional in-app guide (`guide` i18n namespace). Duolingo-style step overlay; header trigger; auto-open once on dashboard after profile is complete. Not the same as profile onboarding. |
