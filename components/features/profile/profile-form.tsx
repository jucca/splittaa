"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  profileFormSchema,
  type ProfileFormValues,
} from "@/lib/validation/profile";
import { UsernameField } from "./username-field";
import { useTranslations } from "next-intl";
import { getIntlDateTimeLocale, resolveLocale } from "@/lib/i18n/locales";
import { useLocale } from "next-intl";

export function ProfileForm({
  mode,
  defaultValues,
  currentUsername,
  usernameLockedUntil,
  isSubmitting,
  onSubmit,
}: {
  mode: "onboarding" | "settings";
  defaultValues: ProfileFormValues;
  currentUsername?: string | null;
  usernameLockedUntil?: number | null;
  isSubmitting?: boolean;
  onSubmit: (values: ProfileFormValues) => Promise<void>;
}) {
  const t = useTranslations("profile");
  const tShared = useTranslations("shared");
  const locale = resolveLocale(useLocale());
  const dateTimeLocale = getIntlDateTimeLocale(locale);

  const usernameLocked =
    mode === "settings" &&
    usernameLockedUntil != null &&
    Date.now() < usernameLockedUntil;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues,
  });

  const username = watch("username");

  return (
    <form
      className="space-y-6"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(values);
      })}
    >
      <div className="space-y-2">
        <Label htmlFor="displayName">{t("displayNameLabel")}</Label>
        <Input id="displayName" {...register("displayName")} />
        {errors.displayName && (
          <p className="text-xs text-destructive">
            {errors.displayName.message}
          </p>
        )}
      </div>

      <UsernameField
        id="username"
        value={username}
        onChange={(v) => setValue("username", v, { shouldValidate: true })}
        disabled={usernameLocked}
        currentUsername={currentUsername}
      />
      {errors.username && (
        <p className="text-xs text-destructive -mt-4">
          {errors.username.message}
        </p>
      )}
      {usernameLocked && usernameLockedUntil && (
        <p className="text-xs text-muted-foreground -mt-4">
          {t("usernameCooldown", {
            date: new Date(usernameLockedUntil).toLocaleDateString(
              dateTimeLocale
            ),
          })}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting
          ? tShared("saving")
          : mode === "onboarding"
            ? t("completeProfile")
            : tShared("save")}
      </Button>
    </form>
  );
}
