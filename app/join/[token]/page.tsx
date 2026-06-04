"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth, SignInButton, SignUpButton } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { BarLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { getConvexErrorFromUnknown } from "@/lib/i18n/convex-errors";
import { resolveLocale } from "@/lib/i18n/locales";

const PENDING_JOIN_KEY = "splittaa_pending_join_token";

export default function JoinGroupPage() {
  const t = useTranslations("join");
  const tShared = useTranslations("shared");
  const locale = resolveLocale(useLocale());
  const params = useParams();
  const router = useRouter();
  const token = typeof params.token === "string" ? params.token : "";
  const { isSignedIn, isLoaded } = useAuth();

  const preview = useQuery(
    api.groupInvites.getInvitePreview,
    token ? { token } : "skip"
  );
  const previewLoading = preview === undefined && !!token;

  const acceptInvite = useConvexMutation(api.groupInvites.acceptInvite);
  const declineInvite = useConvexMutation(api.groupInvites.declineInvite);

  useEffect(() => {
    if (token) {
      sessionStorage.setItem(PENDING_JOIN_KEY, token);
    }
  }, [token]);

  const handleDecline = async () => {
    try {
      await declineInvite.mutate({ token });
      sessionStorage.removeItem(PENDING_JOIN_KEY);
      toast.success(t("toastInviteDeclined"));
      router.push("/dashboard");
    } catch (error) {
      toast.error(getConvexErrorFromUnknown(error, locale));
    }
  };

  const signInRedirect = `/join/${token}`;
  const signUpRedirect = `/join/${token}`;

  if (!token) {
    return (
      <div className="container mx-auto py-12 max-w-md text-center">
        <p>{t("invalidLink")}</p>
      </div>
    );
  }

  if (previewLoading || !isLoaded) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width="100%" color="#36d7b7" />
      </div>
    );
  }

  if (!preview) {
    return (
      <div className="container mx-auto py-12 max-w-md text-center">
        <p>{t("inviteNotFound")}</p>
        <Button asChild className="mt-4">
          <Link href="/">{t("homeLink")}</Link>
        </Button>
      </div>
    );
  }

  if (preview.expired || preview.status !== "pending") {
    return (
      <div className="container mx-auto py-12 max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>{t("inviteInvalidTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              {t("inviteInvalidBody", { groupName: preview.groupName })}
            </p>
            <Button asChild>
              <Link href={isSignedIn ? "/dashboard" : "/"}>
                {isSignedIn ? t("goDashboard") : t("goBack")}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-12 max-w-md">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-3 rounded-md">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>{t("groupInviteTitle")}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {t("invitedBy", { inviterName: preview.inviterName })}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h2 className="text-2xl font-semibold">{preview.groupName}</h2>
            {preview.groupDescription && (
              <p className="text-muted-foreground mt-1">
                {preview.groupDescription}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              {tShared("membersInGroup", { count: preview.memberCount })}
            </p>
          </div>

          {!isSignedIn ? (
            <div className="space-y-3">
              <p className="text-sm">{t("signInToJoin")}</p>
              <SignUpButton mode="modal" forceRedirectUrl={signUpRedirect}>
                <Button className="w-full">{t("signUpAndJoin")}</Button>
              </SignUpButton>
              <SignInButton mode="modal" forceRedirectUrl={signInRedirect}>
                <Button variant="outline" className="w-full">
                  {t("signIn")}
                </Button>
              </SignInButton>
            </div>
          ) : (
            <div className="space-y-3">
              {acceptInvite.isLoading ? (
                <p className="text-sm text-muted-foreground">
                  {t("joiningGroup")}
                </p>
              ) : (
                <>
                  <Button
                    className="w-full"
                    onClick={async () => {
                      const result = await acceptInvite.mutate({ token });
                      router.push(`/groups/${result.groupId}`);
                    }}
                  >
                    {t("acceptInvite")}
                  </Button>
                  {preview.kind === "direct" && (
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleDecline}
                      disabled={declineInvite.isLoading}
                    >
                      {t("declineInvite")}
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
