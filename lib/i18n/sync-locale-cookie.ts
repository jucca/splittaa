"use client";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  isSupportedLocale,
  type AppLocale,
} from "@/lib/i18n/locales";

export function setLocaleCookie(locale: AppLocale) {
  const maxAge = 60 * 60 * 24 * 365;
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function resolvePreferredLocale(
  preferred: string | null | undefined
): AppLocale {
  if (preferred && isSupportedLocale(preferred)) {
    return preferred;
  }
  return DEFAULT_LOCALE;
}
