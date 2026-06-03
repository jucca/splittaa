"use client";

import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import type { FunctionReturnType } from "convex/server";

type PendingInvite = FunctionReturnType<
  typeof api.groupInvites.listMyPendingInvites
>[number];
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";

export function PendingGroupInvites() {
  const { data: invites, isLoading } = useConvexQuery(
    api.groupInvites.listMyPendingInvites
  );

  if (isLoading || !invites?.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Ryhmäkutsut ({invites.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {invites.map((invite: PendingInvite) => (
          <div
            key={invite.inviteId}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-md border p-3"
          >
            <div>
              <p className="font-medium">{invite.groupName}</p>
              <p className="text-sm text-muted-foreground">
                Kutsuja: {invite.inviterName}
              </p>
            </div>
            <Button asChild size="sm">
              <Link href={`/join/${invite.token}`}>Avaa kutsu</Link>
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
