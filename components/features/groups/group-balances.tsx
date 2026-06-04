"use client";

import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { formatCurrency, formatSignedCurrency } from "@/lib/utils";
import { SendDebtRequestButton } from "@/components/features/debt-requests/send-debt-request-button";
import type { Id } from "@/convex/_generated/dataModel";
import { useTranslations } from "next-intl";

type BalanceMember = {
  id: Id<"users">;
  name: string;
  imageUrl?: string | null;
  totalBalance: number;
  owedBy: { from: Id<"users">; amount: number }[];
  owes: { to: Id<"users">; amount: number }[];
};

export function GroupBalances({
  balances,
  groupId,
  groupName,
}: {
  balances: BalanceMember[] | null | undefined;
  groupId?: Id<"groups">;
  groupName?: string;
}) {
  const t = useTranslations("groups");
  const tDashboard = useTranslations("dashboard");
  const { data: currentUser } = useConvexQuery(api.users.me);

  if (!balances?.length || !currentUser) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        {t("balancesUnavailable")}
      </div>
    );
  }

  const me = balances.find((b: BalanceMember) => b.id === currentUser.id);
  if (!me) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        {t("notMember")}
      </div>
    );
  }

  const userMap = Object.fromEntries(
    balances.map((b: BalanceMember) => [b.id, b])
  ) as Record<string, BalanceMember>;

  const owedByMembers = me.owedBy
    .map(({ from, amount }: { from: Id<"users">; amount: number }) => ({
      ...userMap[from],
      amount,
    }))
    .sort((a: { amount: number }, b: { amount: number }) => b.amount - a.amount);

  const owingToMembers = me.owes
    .map(({ to, amount }: { to: Id<"users">; amount: number }) => ({
      ...userMap[to],
      amount,
    }))
    .sort((a: { amount: number }, b: { amount: number }) => b.amount - a.amount);

  const isAllSettledUp =
    me.totalBalance === 0 &&
    owedByMembers.length === 0 &&
    owingToMembers.length === 0;

  return (
    <div className="space-y-4">
      <div className="text-center pb-4 border-b">
        <p className="text-sm text-muted-foreground mb-1">{t("yourBalance")}</p>
        <p
          className={`text-2xl font-bold ${
            me.totalBalance > 0
              ? "text-green-600"
              : me.totalBalance < 0
                ? "text-red-600"
                : ""
          }`}
        >
          {me.totalBalance > 0
            ? formatSignedCurrency(me.totalBalance)
            : me.totalBalance < 0
              ? formatSignedCurrency(me.totalBalance)
              : formatCurrency(0)}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          {me.totalBalance > 0
            ? tDashboard("balanceOwedToYou")
            : me.totalBalance < 0
              ? tDashboard("balanceYouOwe")
              : t("allSettledInGroup")}
        </p>
      </div>

      {isAllSettledUp ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground">{t("everyoneSettled")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {owedByMembers.length > 0 && (
            <div>
              <h3 className="text-sm font-medium flex items-center mb-3">
                <ArrowUpCircle className="h-4 w-4 text-green-500 mr-2" />
                {tDashboard("balanceOwedToYou")}
              </h3>
              <div className="space-y-3">
                {owedByMembers.map((member: BalanceMember & { amount: number }) => (
                  <div
                    key={member.id}
                    className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center justify-between flex-1 gap-2">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={member.imageUrl ?? undefined} />
                          <AvatarFallback>
                            {member.name?.charAt(0) ?? "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{member.name}</span>
                      </div>
                      <span className="font-medium text-green-600">
                        {formatCurrency(member.amount)}
                      </span>
                    </div>
                    {groupId && (
                      <SendDebtRequestButton
                        debtorUserId={member.id}
                        debtorName={member.name}
                        amount={member.amount}
                        groupId={groupId}
                        groupName={groupName}
                        className="w-full sm:w-auto"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {owingToMembers.length > 0 && (
            <div>
              <h3 className="text-sm font-medium flex items-center mb-3">
                <ArrowDownCircle className="h-4 w-4 text-red-500 mr-2" />
                {tDashboard("balanceYouOwe")}
              </h3>
              <div className="space-y-3">
                {owingToMembers.map((member: BalanceMember & { amount: number }) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={member.imageUrl ?? undefined} />
                        <AvatarFallback>
                          {member.name?.charAt(0) ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{member.name}</span>
                    </div>
                    <span className="font-medium text-red-600">
                      {formatCurrency(member.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
