/** Lightweight locale helpers (safe for next-intl request config — no Clerk/date-fns). */

export const LOCALE_COOKIE = "splittaa-locale";

export const SUPPORTED_LOCALE_CODES = [
  "fi",
  "en",
  "fr",
  "sv",
  "de",
  "es",
  "ja",
] as const;
export type AppLocale = (typeof SUPPORTED_LOCALE_CODES)[number];

export const DEFAULT_LOCALE: AppLocale = "fi";

export function isSupportedLocale(value: string): value is AppLocale {
  return (SUPPORTED_LOCALE_CODES as readonly string[]).includes(value);
}

export function resolveLocale(value: string | undefined | null): AppLocale {
  if (value && isSupportedLocale(value)) {
    return value;
  }
  return DEFAULT_LOCALE;
}

/** BCP 47 tag for `Intl` date/time formatting. */
export const INTL_DATE_TIME_LOCALE: Record<AppLocale, string> = {
  fi: "fi-FI",
  en: "en-US",
  fr: "fr-FR",
  sv: "sv-SE",
  de: "de-DE",
  es: "es-ES",
  ja: "ja-JP",
};

export function getIntlDateTimeLocale(locale: AppLocale): string {
  return INTL_DATE_TIME_LOCALE[locale];
}
