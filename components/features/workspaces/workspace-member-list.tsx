"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

type Member = {
  userId: string;
  name: string;
  imageUrl?: string | null;
  role: string;
  isYou: boolean;
};

export function WorkspaceMemberList({
  members,
}: {
  members: Member[] | null | undefined;
}) {
  const t = useTranslations("workspaces");
  const tShared = useTranslations("shared");

  if (!members?.length) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        {t("membersEmpty")}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {members.map((member) => (
        <li
          key={member.userId}
          className="flex items-center justify-between rounded-md p-2 hover:bg-muted"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={member.imageUrl ?? undefined} />
              <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm truncate">
              {member.name}
              {member.isYou && (
                <span className="text-muted-foreground ml-1">
                  {tShared("youParenthetical")}
                </span>
              )}
            </span>
          </div>
          {member.role === "admin" && (
            <Badge variant="secondary" className="text-xs">
              {tShared("admin")}
            </Badge>
          )}
        </li>
      ))}
    </ul>
  );
}
