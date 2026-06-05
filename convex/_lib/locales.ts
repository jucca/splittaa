export const SUPPORTED_LOCALE_CODES = [
  "fi",
  "en",
  "fr",
  "sv",
  "de",
  "es",
  "ja",
] as const;
export type SupportedLocaleCode = (typeof SUPPORTED_LOCALE_CODES)[number];

export function isSupportedLocale(value: string): value is SupportedLocaleCode {
  return (SUPPORTED_LOCALE_CODES as readonly string[]).includes(value);
}
