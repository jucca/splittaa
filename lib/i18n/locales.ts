import { de, enUS, es, fi, fr, ja, sv } from "date-fns/locale";
import type { Locale } from "date-fns";
import {
  deDE as clerkDeDE,
  enUS as clerkEnUS,
  esES as clerkEsES,
  fiFI as clerkFiFI,
  frFR as clerkFrFR,
  jaJP as clerkJaJP,
  svSE as clerkSvSE,
} from "@clerk/localizations";
import type { LocalizationResource } from "@clerk/types";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  SUPPORTED_LOCALE_CODES,
  getIntlDateTimeLocale,
  isSupportedLocale,
  resolveLocale,
  type AppLocale,
} from "@/lib/i18n/locale-codes";

export {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  SUPPORTED_LOCALE_CODES,
  getIntlDateTimeLocale,
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
  {
    code: "fr",
    label: "Français",
    flag: "🇫🇷",
    dateFnsLocale: fr,
    clerkLocalization: clerkFrFR,
  },
  {
    code: "sv",
    label: "Svenska",
    flag: "🇸🇪",
    dateFnsLocale: sv,
    clerkLocalization: clerkSvSE,
  },
  {
    code: "de",
    label: "Deutsch",
    flag: "🇩🇪",
    dateFnsLocale: de,
    clerkLocalization: clerkDeDE,
  },
  {
    code: "es",
    label: "Español",
    flag: "🇪🇸",
    dateFnsLocale: es,
    clerkLocalization: clerkEsES,
  },
  {
    code: "ja",
    label: "日本語",
    flag: "🇯🇵",
    dateFnsLocale: ja,
    clerkLocalization: clerkJaJP,
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
