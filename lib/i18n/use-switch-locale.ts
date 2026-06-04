"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { setLocaleCookie } from "@/lib/i18n/sync-locale-cookie";
import { stripLocalePrefix } from "@/lib/i18n/strip-locale-prefix";
import type { AppLocale } from "@/lib/i18n/locales";

/**
 * Switch UI locale via cookie + refresh. Strips accidental `/fi` or `/en` URL
 * prefixes (from legacy next-intl navigation) before refreshing.
 */
export function useSwitchLocale() {
  const router = useRouter();
  const pathname = usePathname();

  return useCallback(
    (locale: AppLocale) => {
      setLocaleCookie(locale);
      const target = stripLocalePrefix(pathname);
      if (target !== pathname) {
        router.replace(target);
        return;
      }
      router.refresh();
    },
    [router, pathname]
  );
}
