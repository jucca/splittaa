"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { ProfileForm } from "@/components/features/profile/profile-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { getConvexErrorFromUnknown } from "@/lib/i18n/convex-errors";
import { resolveLocale } from "@/lib/i18n/locales";

export default function CreateProfilePage() {
  const t = useTranslations("profile");
  const locale = resolveLocale(useLocale());
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: clerkUser } = useUser();

  const { data: me, isLoading: meLoading } = useConvexQuery(api.users.me);
  const { data: suggestion, isLoading: suggestionLoading } = useConvexQuery(
    api.users.suggestUsername
  );
  const completeProfile = useConvexMutation(api.users.completeProfile);

  const nextPath = searchParams.get("next");

  useEffect(() => {
    if (meLoading || !me) return;
    if (me.profileCompleted) {
      router.replace(nextPath ? decodeURIComponent(nextPath) : "/dashboard");
    }
  }, [me, meLoading, nextPath, router]);

  const defaultValues = useMemo(
    () => ({
      displayName: clerkUser?.fullName ?? me?.name ?? "",
      username: suggestion?.username ?? "",
    }),
    [clerkUser?.fullName, me?.name, suggestion?.username]
  );

  const isLoading = meLoading || suggestionLoading || !suggestion;

  if (isLoading || me?.profileCompleted) {
    return null;
  }

  return (
    <div className="container mx-auto py-6 max-w-lg">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl gradient-title">
            {t("onboardingTitle")}
          </CardTitle>
          <p className="text-muted-foreground text-sm">{t("onboardingSubtitle")}</p>
        </CardHeader>
        <CardContent>
          <ProfileForm
            key={`${defaultValues.username}-${defaultValues.displayName}`}
            mode="onboarding"
            defaultValues={defaultValues}
            isSubmitting={completeProfile.isLoading}
            onSubmit={async (values) => {
              try {
                await completeProfile.mutate({
                  displayName: values.displayName,
                  username: values.username,
                });
                toast.success(t("toastProfileSaved"));
                router.replace(
                  nextPath ? decodeURIComponent(nextPath) : "/dashboard"
                );
              } catch (error) {
                toast.error(
                  getConvexErrorFromUnknown(error, locale)
                );
              }
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
