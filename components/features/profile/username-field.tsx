"use client";

import { useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeUsername } from "@/lib/usernames";
import { useTranslations } from "next-intl";

export function UsernameField({
  id,
  value,
  onChange,
  disabled = false,
  currentUsername,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  currentUsername?: string | null;
}) {
  const t = useTranslations("profile");
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  const normalized = normalizeUsername(debounced);
  const shouldCheck =
    normalized.length >= 3 &&
    (!currentUsername || normalized !== currentUsername);

  const availability = useQuery(
    api.users.isUsernameAvailable,
    shouldCheck ? { username: normalized } : "skip"
  );
  const isLoading = shouldCheck && availability === undefined;

  let status: "idle" | "checking" | "available" | "taken" = "idle";
  if (shouldCheck) {
    if (isLoading) status = "checking";
    else if (availability?.available) status = "available";
    else if (availability && !availability.available) status = "taken";
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{t("usernameLabel")}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          @
        </span>
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(normalizeUsername(e.target.value))}
          disabled={disabled}
          className="pl-7"
          autoComplete="off"
          spellCheck={false}
        />
      </div>
      <p className="text-xs text-muted-foreground">{t("usernameHint")}</p>
      {status === "checking" && (
        <p className="text-xs text-muted-foreground">{t("usernameChecking")}</p>
      )}
      {status === "available" && (
        <p className="text-xs text-green-600 dark:text-green-400">
          {t("usernameAvailable")}
        </p>
      )}
      {status === "taken" && (
        <p className="text-xs text-destructive">{t("usernameTaken")}</p>
      )}
    </div>
  );
}
