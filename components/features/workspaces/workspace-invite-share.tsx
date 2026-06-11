"use client";

import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function WorkspaceInviteShare({
  workspaceId,
  isAdmin,
}: {
  workspaceId: Id<"workspaces">;
  isAdmin: boolean;
}) {
  const t = useTranslations("workspaces");
  const tShared = useTranslations("shared");
  const { data: openInvite, isLoading } = useConvexQuery(
    api.workspaceInvites.getOpenInviteForWorkspace,
    isAdmin ? { workspaceId } : "skip"
  );
  const ensureOpenInvite = useConvexMutation(
    api.workspaceInvites.ensureOpenInvite
  );

  if (!isAdmin) return null;

  const invite = openInvite;

  const copyCode = async () => {
    if (!invite?.displayCode) return;
    await navigator.clipboard.writeText(invite.displayCode);
    toast.success(t("toastCodeCopied"));
  };

  const handleCreate = async () => {
    await ensureOpenInvite.mutate({ workspaceId });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{t("inviteShareTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <p className="text-sm text-muted-foreground">{t("inviteShareHint")}</p>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">{t("loading")}</p>
        ) : invite ? (
          <div className="flex gap-2">
            <Input
              readOnly
              value={invite.displayCode}
              className="font-mono tracking-widest"
            />
            <Button type="button" variant="outline" size="icon" onClick={copyCode}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            onClick={handleCreate}
            disabled={ensureOpenInvite.isLoading}
          >
            {ensureOpenInvite.isLoading ? tShared("creating") : t("createInviteCode")}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
