# Teemaperustaiset työpöydät (design)

**Date:** 2026-06-11  
**Branch:** feature/teemaperustainen-työpöytä  
**Status:** Approved

## Goal

Käyttäjä voi luoda aihekohtaisia työpöytänäkymiä (esim. Ranskan reissu, säästäminen tietokoneeseen, vuokra-asunnon kulut), joissa on valmiit visuaaliset teemat, useita tavoitteita, jaetut jäsenet ja etusivun kaltainen yhteenveto — erillään globaalista `/dashboard`-näkymästä.

## Päätökset

| Aihe | Valinta |
|------|---------|
| Perusmalli | Uusi säiliö (`workspaces`), ei ryhmän laajennus |
| Tavoitteet | Pakollisia; `budget_cap` ja `savings_target`; useita per työpöytä |
| Jaettavuus | Jaettava kutsuilla (admin/member) |
| Kulut | Luodaan suoraan työpöydän kontekstissa (`workspaceId`) |
| Visuaali | Valmiit teemat (`matka`, `saastaminen`, `koti`, `yleinen`) |
| Layout | Sama rakenne kuin globaali etusivu + tavoitekortit ylhäällä |
| Navigointi | Työpöytälista sivupalkissa |
| Globaali etusivu | Työpöydän data erillinen — ei näy `/dashboard`-datassa |

## Data model

### `workspaces`

- `name`, `themeId`, `createdBy`
- `members[]`: `{ userId, role: "admin" | "member", joinedAt }`

### `workspaceGoals`

- `workspaceId`, `type: "budget_cap" | "savings_target"`, `label`, `targetAmount`, `currency`, `sortOrder`

### `workspaceDeposits`

- Säästötavoitteen talletukset: `workspaceId`, `goalId`, `amount`, `currency`, `note`, `date`, `createdBy`

### `workspaceInvites`

- Peilaa `groupInvites`: direct + open (token, displayCode, status, expiresAt)

### Laajennukset

- `expenses.workspaceId` (ei samanaikaisesti `groupId` MVP:ssä)
- `settlements.workspaceId` (ei samanaikaisesti `groupId` MVP:ssä)
- `balances.scopeType`: `"workspace"` + `scopeWorkspaceId`

## Tavoitteiden laskenta

| Tyyppi | Edistyminen |
|--------|-------------|
| `budget_cap` | Työpöydän kulujen kokonaissumma vs `targetAmount` |
| `savings_target` | `workspaceDeposits` summa vs `targetAmount` |

## Teemat (MVP)

Staattinen rekisteri `lib/workspace-themes.ts`: `matka`, `saastaminen`, `koti`, `yleinen`. Vaikuttaa accent-väriin, ikoniin ja korttien korostukseen.

## UI

| Reitti | Tarkoitus |
|--------|-----------|
| `/tyopoydat` | Lista + luonti |
| `/tyopoyta/[id]` | Työpöydän etusivu |
| `/expenses/new?workspaceId=...` | Kulun luonti työpöydässä |

Sivupalkki `(main)`-layoutissa listaa työpöydät.

## Out of scope (MVP)

- Linkitys olemassa oleviin ryhmäkuluihin
- Muokattavat widgetit
- Työpöytä oletusetusivuna
- Velkapyynnöt työpöydän kontekstissa
- Globaalin etusivun yhdistäminen

## Terminologia

| Term | Meaning |
|------|---------|
| Työpöytä | Jaettava aihekohtainen säiliö (`workspaces`) |
| Globaali etusivu | `/dashboard` — kaikki ei-työpöytä-data |
| Tavoite | Budjettikatto tai säästötavoite (`workspaceGoals`) |
