"use client";

import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProfileForm } from "./profile-form";
import { toast } from "sonner";
import { User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { getConvexErrorFromUnknown } from "@/lib/i18n/convex-errors";
import { resolveLocale } from "@/lib/i18n/locales";
import { normalizeUsername } from "@/lib/usernames";

export function ProfileSettings() {
  const t = useTranslations("profile");
  const locale = resolveLocale(useLocale());
  const { user: clerkUser } = useUser();
  const { data: me, isLoading } = useConvexQuery(api.users.me);
  const updateDisplayName = useConvexMutation(api.users.updateDisplayName);
  const updateUsername = useConvexMutation(api.users.updateUsername);

  if (isLoading || !me) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {t("settingsCardTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={clerkUser?.imageUrl} />
            <AvatarFallback>{me.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{me.name}</p>
            {me.username && (
              <p className="text-sm text-muted-foreground">@{me.username}</p>
            )}
          </div>
        </div>

        <ProfileForm
          key={`${me.name}-${me.username ?? ""}`}
          mode="settings"
          currentUsername={me.username}
          usernameLockedUntil={me.usernameChangeAllowedAt}
          defaultValues={{
            displayName: me.name,
            username: me.username ?? "",
          }}
          isSubmitting={
            updateDisplayName.isLoading || updateUsername.isLoading
          }
          onSubmit={async (values) => {
            try {
              const displayChanged = values.displayName.trim() !== me.name;
              const usernameChanged =
                me.username != null &&
                normalizeUsername(values.username) !== me.username;

              if (displayChanged) {
                await updateDisplayName.mutate({
                  displayName: values.displayName,
                });
              }
              if (usernameChanged) {
                await updateUsername.mutate({
                  username: values.username,
                });
              }
              if (!displayChanged && !usernameChanged) {
                toast.message(t("toastNoChanges"));
                return;
              }
              toast.success(t("toastProfileSaved"));
            } catch (error) {
              toast.error(getConvexErrorFromUnknown(error, locale));
            }
          }}
        />
      </CardContent>
    </Card>
  );
}
