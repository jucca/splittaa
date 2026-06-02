"use client";

import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

import type { Id } from "@/convex/_generated/dataModel";

type GroupMember = {
  id: Id<"users">;
  name: string;
  imageUrl?: string | null;
  role?: string;
};

export function GroupMembers({
  members,
}: {
  members: GroupMember[] | null | undefined;
}) {
  const { data: currentUser } = useConvexQuery(api.users.me);

  if (!members || members.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        Ryhmässä ei ole jäseniä
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member: GroupMember) => {
        const isCurrentUser = member.id === currentUser?.id;
        const isAdmin = member.role === "admin";

        return (
          <div key={member.id} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={member.imageUrl ?? undefined} />
                <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {isCurrentUser ? "Sinä" : member.name}
                  </span>
                  {isCurrentUser && (
                    <Badge variant="outline" className="text-xs py-0 h-5">
                      Sinä
                    </Badge>
                  )}
                </div>
                {isAdmin && (
                  <span className="text-xs text-muted-foreground">
                    Ylläpitäjä
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
