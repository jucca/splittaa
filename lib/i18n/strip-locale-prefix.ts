import {
  isSupportedLocale,
  type AppLocale,
} from "@/lib/i18n/locale-codes";

/** `/en/dashboard` → `/dashboard`; `/en` → `/`; `/dashboard` unchanged. */
export function stripLocalePrefix(pathname: string): string {
  const segments = pathname.split("/");
  if (segments.length > 1 && isSupportedLocale(segments[1]!)) {
    const rest = segments.slice(2).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname;
}

/** First segment if it is a supported locale code, else null. */
export function localeFromPathname(pathname: string): AppLocale | null {
  const code = pathname.split("/")[1];
  return code && isSupportedLocale(code) ? code : null;
}
