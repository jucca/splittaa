"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { enUS } from "@clerk/localizations";
import { shadcn } from "@clerk/ui/themes";
import { useLocale } from "next-intl";
import type { ReactNode } from "react";
import { getLocaleDefinition, resolveLocale } from "@/lib/i18n/locales";

export function ClerkLocaleProvider({ children }: { children: ReactNode }) {
  const locale = resolveLocale(useLocale());
  const clerkLocalization =
    getLocaleDefinition(locale).clerkLocalization ?? enUS;

  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      localization={clerkLocalization}
      appearance={{ theme: shadcn }}
    >
      {children}
    </ClerkProvider>
  );
}
