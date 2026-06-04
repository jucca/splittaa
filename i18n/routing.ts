import { defineRouting } from "next-intl/routing";
import {
  DEFAULT_LOCALE,
  SUPPORTED_LOCALE_CODES,
} from "@/lib/i18n/locale-codes";

export const routing = defineRouting({
  locales: [...SUPPORTED_LOCALE_CODES],
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: "never",
  localeCookie: {
    name: "splittaa-locale",
  },
});
