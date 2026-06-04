import type { AppLocale } from "@/lib/i18n/locales";

const ERROR_MESSAGES: Record<AppLocale, Record<string, string>> = {
  fi: {
    FORBIDDEN: "Ei oikeutta tähän toimintoon",
    NOT_FOUND: "Ei löytynyt",
    UNAUTHORIZED: "Kirjautuminen vaaditaan",
    INVALID_INPUT: "Virheelliset tiedot",
  },
  en: {
    FORBIDDEN: "You do not have permission for this action",
    NOT_FOUND: "Not found",
    UNAUTHORIZED: "Sign-in required",
    INVALID_INPUT: "Invalid input",
  },
};

export function mapConvexError(
  code: string | undefined,
  locale: AppLocale,
  fallbackMessage?: string
): string {
  if (code) {
    const mapped = ERROR_MESSAGES[locale][code];
    if (mapped) return mapped;
  }
  if (fallbackMessage) {
    return fallbackMessage;
  }
  return locale === "fi" ? "Tuntematon virhe" : "Unknown error";
}

export function getConvexErrorFromUnknown(
  error: unknown,
  locale: AppLocale
): string {
  const data = (error as { data?: { code?: string; message?: string } })?.data;
  const fallback =
    error instanceof Error ? error.message : undefined;
  return mapConvexError(data?.code, locale, data?.message ?? fallback);
}
