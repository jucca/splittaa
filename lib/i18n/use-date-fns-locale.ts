"use client";

import { useLocale } from "next-intl";
import { getLocaleDefinition, resolveLocale } from "@/lib/i18n/locales";

export function useDateFnsLocale() {
  const locale = resolveLocale(useLocale());
  return getLocaleDefinition(locale).dateFnsLocale;
}
