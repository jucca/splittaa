# Kielistys — design spec

**Date:** 2026-06-04  
**Branch:** Kielistys  
**Status:** approved for implementation

## Goal

Header language switcher (flag + dynamic locale list) and extensible fi/en UI i18n without URL locale prefixes.

## Locale registry

Single source: `lib/i18n/locales.ts` — `SUPPORTED_LOCALES`, `DEFAULT_LOCALE`, `isSupportedLocale`, `getLocaleDefinition`.

Adding a language: `messages/{code}.json` + one registry row + `npm run check:i18n`.

## Stack

- **next-intl** — cookie `splittaa-locale`, `localePrefix: 'never'`
- **Clerk** — `clerkLocalization` from registry, fallback `enUS`
- **Convex** — `users.preferredLocale` optional string, validated server-side
- **Errors** — stable `code` + `lib/i18n/convex-errors.ts` per locale
- **Notifications** — translate by `type` + params on client where possible

## UX

`ThemeToggle` then `LanguageSwitcher` in header (authenticated and guest). Popover lists all `SUPPORTED_LOCALES`.

## Out of scope

- Localized URL paths (`/en/dashboard`)
- Email/Inngest bilingual templates (noted in exec plan)

## MVP locales

`fi` (default), `en`
