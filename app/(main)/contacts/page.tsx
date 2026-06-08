"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { BarLoader } from "react-spinners";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Users, User } from "lucide-react";
import { CreateGroupModal } from "@/components/features/contacts/create-group-modal";
import type { FunctionReturnType } from "convex/server";
import { useTranslations } from "next-intl";
import { formatUsernameLabel } from "@/lib/usernames";

type ContactsData = NonNullable<
  FunctionReturnType<typeof api.contacts.getAllContacts>
>;
type ContactUser = ContactsData["users"][number];
type ContactGroup = ContactsData["groups"][number];

export default function ContactsPage() {
  const t = useTranslations("contacts");
  const tShared = useTranslations("shared");
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const { data, isLoading } = useConvexQuery(api.contacts.getAllContacts);

  useEffect(() => {
    const createGroupParam = searchParams.get("createGroup");

    if (createGroupParam === "true") {
      setIsCreateGroupModalOpen(true);

      const url = new URL(window.location.href);
      url.searchParams.delete("createGroup");

      router.replace(url.pathname + url.search);
    }
  }, [searchParams, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-12">
        <BarLoader width={"100%"} color="#36d7b7" />
      </div>
    );
  }

  const { users, groups } = data || { users: [], groups: [] };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between mb-6">
        <h1 className="text-5xl gradient-title">{t("title")}</h1>
        <Button onClick={() => setIsCreateGroupModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {t("createGroup")}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <User className="mr-2 h-5 w-5" />
            {t("peopleSection")}
          </h2>
          {users.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                {t("peopleEmpty")}
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {users.map((user: ContactUser) => (
                <Link key={user.id} href={`/person/${user.id}`}>
                  <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={user.imageUrl} />
                            <AvatarFallback>
                              {user.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.name}</p>
                            {user.username ? (
                              <p className="text-sm text-muted-foreground">
                                {formatUsernameLabel(user.username)}
                              </p>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                {user.email}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center">
            <Users className="mr-2 h-5 w-5" />
            {t("groupsSection")}
          </h2>
          {groups.length === 0 ? (
            <Card>
              <CardContent className="py-6 text-center text-muted-foreground">
                {t("groupsEmpty")}
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col gap-4">
              {groups.map((group: ContactGroup) => (
                <Link key={group.id} href={`/groups/${group.id}`}>
                  <Card className="hover:bg-muted/30 transition-colors cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="bg-primary/10 p-2 rounded-md">
                            <Users className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{group.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {tShared("membersCount", {
                                count: group.memberCount,
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <CreateGroupModal
        isOpen={isCreateGroupModalOpen}
        onClose={() => setIsCreateGroupModalOpen(false)}
        onSuccess={(groupId) => {
          router.push(`/groups/${groupId}`);
        }}
      />
    </div>
  );
}
