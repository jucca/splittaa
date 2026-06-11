"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Hash } from "lucide-react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { getConvexErrorFromUnknown } from "@/lib/i18n/convex-errors";
import { resolveLocale } from "@/lib/i18n/locales";

export function WorkspaceJoinByCodeForm() {
  const t = useTranslations("workspaces");
  const tShared = useTranslations("shared");
  const locale = resolveLocale(useLocale());
  const [code, setCode] = useState("");
  const router = useRouter();
  const joinByCode = useConvexMutation(api.workspaceInvites.joinByDisplayCode);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;

    try {
      const result = await joinByCode.mutate({ displayCode: trimmed });
      if (result.alreadyMember) {
        toast.info(t("toastAlreadyMember"));
      } else {
        toast.success(t("toastJoined"));
      }
      router.push(`/tyopoyta/${result.workspaceId}`);
    } catch (error) {
      toast.error(getConvexErrorFromUnknown(error, locale));
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Hash className="h-5 w-5" />
          {t("joinByCodeTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex-1 space-y-1">
            <Label htmlFor="workspace-join-code" className="sr-only">
              {t("joinCodeLabel")}
            </Label>
            <Input
              id="workspace-join-code"
              placeholder={t("joinCodePlaceholder")}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="font-mono tracking-widest"
              maxLength={12}
            />
          </div>
          <Button type="submit" disabled={joinByCode.isLoading || !code.trim()}>
            {joinByCode.isLoading ? tShared("joining") : t("joinButton")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
