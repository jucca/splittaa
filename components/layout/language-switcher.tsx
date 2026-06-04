"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useSwitchLocale } from "@/lib/i18n/use-switch-locale";
import {
  SUPPORTED_LOCALES,
  resolveLocale,
  type AppLocale,
} from "@/lib/i18n/locales";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useConvexAuth } from "convex/react";
import { Check } from "lucide-react";

export function LanguageSwitcher() {
  const t = useTranslations("language");
  const locale = resolveLocale(useLocale());
  const switchLocale = useSwitchLocale();
  const [open, setOpen] = useState(false);
  const { isAuthenticated } = useConvexAuth();
  const updateLocale = useMutation(api.users.updatePreferredLocale);

  const current = SUPPORTED_LOCALES.find((l) => l.code === locale)!;

  const handleSelect = async (next: AppLocale) => {
    if (next === locale) {
      setOpen(false);
      return;
    }
    if (isAuthenticated) {
      try {
        await updateLocale({ locale: next });
      } catch {
        // Cookie + refresh still apply
      }
    }
    switchLocale(next);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-lg leading-none"
          aria-label={t("switch")}
          data-testid="language-switcher"
        >
          <span aria-hidden>{current.flag}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-1">
        <ul className="flex flex-col" role="listbox" aria-label={t("switch")}>
          {SUPPORTED_LOCALES.map((item) => (
            <li key={item.code}>
              <button
                type="button"
                role="option"
                aria-selected={item.code === locale}
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-accent"
                onClick={() => handleSelect(item.code)}
                data-testid={`language-option-${item.code}`}
              >
                <span className="text-lg" aria-hidden>
                  {item.flag}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
                {item.code === locale ? (
                  <Check className="h-4 w-4 text-green-600" aria-hidden />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
