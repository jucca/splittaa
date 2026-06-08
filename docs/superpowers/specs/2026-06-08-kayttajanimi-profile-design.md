# Käyttäjänimi ja näyttönimi — Design Spec

**Status:** Approved (brainstorming 2026-06-08)  
**Scope:** Profiilin luonti ensimmäisellä kirjautumisella, yksilöllinen käyttäjänimi + näyttönimi, haku ja asetukset  
**Branch:** `käyttäjänimi`

## Decisions summary

| Decision | Choice |
|----------|--------|
| Kentät | Näyttönimi + yksilöllinen käyttäjänimi (tunnus) |
| Ensimmäinen kirjautuminen | Pakollinen profiilinluonti ennen sovelluksen käyttöä |
| Tunnus | Globaalisti yksilöllinen; automaattinen ehdotus Clerk-nimestä |
| Muutokset | Näyttönimi vapaasti; tunnus max kerran 30 päivässä |
| Hakunäkymä | Näyttönimi + `@tunnus` (ei sähköpostia tuloksissa) |
| Toteutus | Laajenna `users`-taulua (ei erillistä `profiles`-taulua) |

---

## 1. Problem and goals

### Problem

Käyttäjän nimi tulee tänään Clerkistä (`identity.name`) ja tallentuu `users.name`-kenttään. `users.store` ylikirjoittaa nimen Clerkistä automaattisesti. Osallistujahaku näyttää nimen ja sähköpostin — samannimisten erottelu on hankalaa, eikä käyttäjä voi valita helposti muistettavaa tunnusta.

### Goals

1. Jokaisella käyttäjällä on **näyttönimi** (miten muut näkevät hänet) ja **käyttäjänimi** (yksilöllinen tunnus hakuun).
2. Uusi käyttäjä luo profiilin **pakollisesti** ensimmäisellä kirjautumisella.
3. Henkilöiden valinta yhteisiin kuluihin on helpompaa: haku tunnuksella ja näyttönimellä, tuloksissa selkeä muoto `Nimi (@tunnus)`.
4. Olemassa olevat käyttäjät täydentävät profiilin seuraavalla kirjautumisella.

### Non-goals (v1)

- Avatarin muokkaus Splittaassa (Clerk-kuva riittää).
- Julkinen profiilisivu tai `@tunnus`-URL.
- Käyttäjänimen vaihto Clerk-metadatassa.
- Sähköpostin näyttäminen hakutuloksissa.

---

## 2. Data model

### Schema changes (`users`)

| Field | Type | Description |
|-------|------|-------------|
| `name` | `string` | **Näyttönimi** — käyttäjän valitsema; käytetään kaikissa nykyisissä näyttöpaikoissa |
| `username` | `optional string` | Yksilöllinen tunnus, tallennetaan pienin kirjaimin (`jukka`, ei `@jukka`) |
| `profileCompletedAt` | `optional number` | Unix ms; puuttuu = onboarding kesken |
| `usernameChangedAt` | `optional number` | Viimeisin tunnuksen vaihto (30 pv rate limit) |

Olemassa olevat kentät (`email`, `tokenIdentifier`, `imageUrl`, asetukset) säilyvät.

### Indexes

- `by_username` on `["username"]` — uniikki haku ja duplikaattien esto
- `search_username` — search index `username`-kentälle (osallistujahaku)
- Nykyinen `search_name` säilyy näyttönimelle

### Semantics change

`name` ei enää synkronoidu Clerkistä profiilin valmistuttua. Clerk voi päivittää edelleen `email` ja `imageUrl`.

### Username rules

- Pituus: 3–20 merkkiä
- Merkit: `a-z`, `0-9`, `_` (ASCII)
- Tallennus: aina lowercase; UI normalisoi syötteen
- Näyttö: `@jukka` (etuliite vain UI:ssa)
- Varattuja sanoja: `admin`, `api`, `support`, `splittaa`, `me`, `null`, `undefined` (lista laajennettavissa `_lib/usernames.ts`)

### Suggestion algorithm

`slugify(clerkName)` → poista ääkköset (ä→a, ö→o), välilyönnit/alaviivat, poista kielletyt merkit. Jos varattu tai käytössä, lisää numero: `jukka`, `jukka2`, `jukka3`, … (max 100 yritystä, sitten satunnainen suffiksi).

---

## 3. Convex API

### Modified: `users.store`

- **Uusi käyttäjä:** insert Clerk-tiedoilla; `name` = Clerk-nimi väliaikaisena; `profileCompletedAt` undefined.
- **Paluu:** patch `email` / `imageUrl` tarvittaessa; **älä** patchaa `name` tai `username` jos `profileCompletedAt` on asetettu.

### New: `users.completeProfile`

```ts
args: { displayName: v.string(), username: v.string() }
```

- `requireAuth()`
- Hylkää jos `profileCompletedAt` jo asetettu
- Validoi näyttönimi (1–50 merkkiä, trim)
- Validoi ja normalisoi username; tarkista uniikkius `by_username`
- Patch: `name`, `username`, `profileCompletedAt: Date.now()`, `usernameChangedAt: Date.now()`

### New: `users.suggestUsername`

- `requireAuth()`
- Palauttaa ehdotuksen nykyisen Clerk/identity-nimen perusteella (ei vaadi valmista profiilia)

### New: `users.isUsernameAvailable`

```ts
args: { username: v.string() }
returns: { available: boolean }
```

- `requireAuth()`; normalisoi; tarkista formaatti ja varatut sanat; vertaa `by_username` (salli oma nykyinen tunnus asetuksissa)

### New: `users.updateDisplayName`

```ts
args: { displayName: v.string() }
```

- Vaatii `profileCompletedAt`; validoi; patch `name`

### New: `users.updateUsername`

```ts
args: { username: v.string() }
```

- Vaatii `profileCompletedAt`
- Hylkää jos `Date.now() - usernameChangedAt < 30 * 24 * 60 * 60 * 1000`
- Validoi, uniikkius, patch `username` + `usernameChangedAt`

### Modified: `users.me`

Palauta lisäksi:

```ts
{
  id, name, username, imageUrl,
  profileCompleted: boolean,  // !!profileCompletedAt
  usernameChangeAllowedAt: number | null,  // usernameChangedAt + 30d
  preferredLocale, preferredCurrency,
}
```

### Modified: `users.searchUsers`

- Hae `search_name`, `search_username`, ja `search_email` (sähköposti vain hakukenttään, ei vastauksessa).
- Vastaus: `{ id, name, username, imageUrl }` — **ei `email`**.

---

## 4. Frontend

### Onboarding (`/profiili/luo`)

- Erillinen sivu autentikoituneelle käyttäjälle; ei pääsovelluksen navigaatiota.
- Lomake (Zod + react-hook-form):
  - Näyttönimi (esitäytetty Clerk-nimellä)
  - Käyttäjänimi (esitäytetty `suggestUsername`; reaaliaikainen saatavuus debouncella)
- Submit → `completeProfile` → redirect alkuperäiseen `?next=` tai `/dashboard`.
- Virheet suomeksi (toast + kenttävirheet).

### Profile gate

`ProfileGate` `(main)`-layoutissa tai erillisessä wrapperissä:

- Jos `me.profileCompleted === false` ja polku ei ole `/profiili/luo` eikä `/join/*` → `redirect('/profiili/luo?next=…')`.
- `/join/[token]` sallitaan: käyttäjä voi hyväksyä kutsun vasta profiilin jälkeen tai gate ohjaa onboardingiin ennen hyväksyntää (toteutus: gate ensin, join-link säilyttää `next`).

### Settings (`/asetukset`)

Uusi **Profiili**-kortti (yläpuolella):

| Kenttä | Toiminto |
|--------|----------|
| Näyttönimi | Muokattava; `updateDisplayName` |
| Käyttäjänimi | Muokattava rate limitin sisällä; näytä seuraava sallittu päivä jos estetty |
| Avatar | Clerk-kuva, read-only |

### Participant search UI

Päivitä `participant-selector`, `create-group-modal`, `contacts`-haku:

```
Jukka Virtanen
@jukka
```

Poista sähköpostirivi hakutuloksista. Päivitä `Participant`-tyyppi: lisää `username?: string`.

### Muut näkymät

- Ryhmän jäsenet, kululista, saldot, aktiviteetti: näyttönimi ensisijainen; `@tunnus` toissijaisena tarvittaessa.
- Sähköpostipohjat: näyttönimi; tunnus valinnainen alatekstinä.

### i18n

Uudet avaimet `messages/fi.json` (+ muut kielet): onboarding, profiili-asetukset, validointivirheet, rate-limit -viesti.

---

## 5. Migration

1. Deploy schema: uudet optional-kentät (ei riko olemassa olevia rivejä).
2. Olemassa olevilla käyttäjillä `username` ja `profileCompletedAt` puuttuvat → ensimmäisellä kirjautumisella onboarding.
3. Väliaikainen `name` = Clerk-nimi säilyy kunnes käyttäjä täydentää profiilin.
4. Ei automaattista massamigraatiota — käyttäjä vahvistaa näyttönimen ja tunnuksen itse.

---

## 6. Error handling

| Case | Finnish message |
|------|-----------------|
| Username taken | `Käyttäjänimi on jo käytössä` |
| Invalid format | `Käyttäjänimen tulee olla 3–20 merkkiä: pienet kirjaimet, numerot ja alaviiva` |
| Rate limited | `Käyttäjänimen voi vaihtaa uudelleen {date} jälkeen` |
| Profile incomplete | Redirect to onboarding (no error toast) |
| Reserved username | `Käyttäjänimi ei ole saatavilla` |

Validointi: Convex-mutaatio (source of truth) + Zod lomakkeessa (UX).

---

## 7. Security

- Kaikki uudet/muokatut endpointit: `requireAuth()`.
- `isUsernameAvailable` ei paljasta käyttäjätietoja — vain boolean.
- Sähköposti poistettu `searchUsers`-vastauksesta (haku sähköpostilla sallittu, näyttö estetty).
- Päivitä `docs/SECURITY.md` public API -matriisi.

---

## 8. Testing

| Layer | Cases |
|-------|--------|
| `lib/usernames.ts` | slugify, validate, reserved words, suggestion with collision |
| Convex | `completeProfile` happy path; duplicate username; incomplete profile gate; `store` no overwrite after complete; `updateUsername` rate limit |
| UI (optional v1) | Onboarding redirect; search result shape |

Aja `npm run verify` ennen PR:ää.

---

## 9. Files to touch (implementation hint)

| Area | Files |
|------|--------|
| Schema | `convex/schema.ts` |
| API | `convex/users.ts`, `lib/usernames.ts` (new) |
| Gate | `components/layout/profile-gate.tsx` (new), `app/(main)/layout.tsx` |
| Onboarding | `app/(main)/profiili/luo/page.tsx` (new) |
| Settings | `app/(main)/asetukset/page.tsx`, `components/features/profile/` (new) |
| Search UI | `participant-selector.tsx`, `create-group-modal.tsx`, `contacts/page.tsx` |
| Types | `lib/types/domain.ts` |
| Docs | `docs/PRODUCT_SENSE.md`, `docs/SECURITY.md`, `docs/generated/db-schema.md` |
| i18n | `messages/*.json` |

---

## 10. Open questions (resolved)

All brainstorming questions resolved 2026-06-08. No remaining TBDs for v1.
