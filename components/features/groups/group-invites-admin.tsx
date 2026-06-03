"use client";

import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/use-convex-query";
import type { Id } from "@/convex/_generated/dataModel";
import type { FunctionReturnType } from "convex/server";

type GroupInviteRow = FunctionReturnType<
  typeof api.groupInvites.listGroupInvites
>[number];
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { GroupInviteShare } from "./group-invite-share";
import { UserPlus, X } from "lucide-react";

export function GroupInvitesAdmin({ groupId }: { groupId: Id<"groups"> }) {
  const { data: pendingInvites } = useConvexQuery(api.groupInvites.listGroupInvites, {
    groupId,
  });
  const { data: openInvite } = useConvexQuery(api.groupInvites.getOpenInviteForGroup, {
    groupId,
  });
  const revokeInvite = useConvexMutation(api.groupInvites.revokeInvite);

  const directPending =
    pendingInvites?.filter((i: GroupInviteRow) => i.kind === "direct") ?? [];

  const handleRevoke = async (inviteId: Id<"groupInvites">) => {
    try {
      await revokeInvite.mutate({ inviteId });
      toast.success("Kutsu peruttu");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      toast.error("Kutsun peruminen epäonnistui: " + message);
    }
  };

  if (!openInvite && directPending.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Kutsut ja liittyminen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {openInvite && <GroupInviteShare openInvite={openInvite} />}

        {directPending.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Odottavat kutsut</p>
            <ul className="space-y-2">
              {directPending.map((invite: GroupInviteRow) => (
                <li
                  key={invite.inviteId}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <span>
                    {invite.invitedUserName ?? "Tuntematon käyttäjä"}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevoke(invite.inviteId)}
                    aria-label="Peru kutsu"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Peru
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
