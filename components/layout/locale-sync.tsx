"use client";

import { useEffect, useRef } from "react";
import { useConvexAuth, useQuery } from "convex/react";
import { useLocale } from "next-intl";
import { api } from "@/convex/_generated/api";
import {
  isSupportedLocale,
  resolveLocale,
  type AppLocale,
} from "@/lib/i18n/locales";
import { useSwitchLocale } from "@/lib/i18n/use-switch-locale";

export function LocaleSync() {
  const { isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const currentLocale = resolveLocale(useLocale());
  const switchLocale = useSwitchLocale();
  const syncedRef = useRef<string | null>(null);

  useEffect(() => {
    const preferred = me?.preferredLocale;
    if (!preferred || !isSupportedLocale(preferred)) return;
    if (preferred === currentLocale) return;
    if (syncedRef.current === preferred) return;
    syncedRef.current = preferred;
    switchLocale(preferred as AppLocale);
  }, [me?.preferredLocale, currentLocale, switchLocale]);

  return null;
}
