import { enUS, fi } from "date-fns/locale";
import type { Locale } from "date-fns";
import { enUS as clerkEnUS, fiFI as clerkFiFI } from "@clerk/localizations";
import type { LocalizationResource } from "@clerk/types";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  SUPPORTED_LOCALE_CODES,
  isSupportedLocale,
  resolveLocale,
  type AppLocale,
} from "@/lib/i18n/locale-codes";

export {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  SUPPORTED_LOCALE_CODES,
  isSupportedLocale,
  resolveLocale,
  type AppLocale,
};

export type LocaleDefinition = {
  code: AppLocale;
  label: string;
  flag: string;
  dateFnsLocale: Locale;
  clerkLocalization: LocalizationResource;
};

export const SUPPORTED_LOCALES: readonly LocaleDefinition[] = [
  {
    code: "fi",
    label: "Suomi",
    flag: "🇫🇮",
    dateFnsLocale: fi,
    clerkLocalization: clerkFiFI,
  },
  {
    code: "en",
    label: "English",
    flag: "🇬🇧",
    dateFnsLocale: enUS,
    clerkLocalization: clerkEnUS,
  },
] as const;

const localeByCode = new Map(
  SUPPORTED_LOCALES.map((definition) => [definition.code, definition])
);

export function getLocaleDefinition(code: AppLocale): LocaleDefinition {
  const definition = localeByCode.get(code);
  if (!definition) {
    throw new Error(`Unsupported locale: ${code}`);
  }
  return definition;
}
