"use client";

import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { format as formatDate } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight } from "lucide-react";
import { useMoney } from "@/components/providers/money-format-provider";
import type { Id } from "@/convex/_generated/dataModel";
import { useTranslations } from "next-intl";
import { useDateFnsLocale } from "@/lib/i18n/use-date-fns-locale";

export type SettlementListItem = {
  _id: Id<"settlements">;
  amount: number;
  currency?: string;
  date: number;
  note?: string;
  paidByUserId: Id<"users">;
  receivedByUserId: Id<"users">;
};

export function SettlementList({
  settlements,
  isGroupSettlement = false,
  userLookupMap = {},
}: {
  settlements: SettlementListItem[] | null | undefined;
  isGroupSettlement?: boolean;
  userLookupMap?: Record<string, { name?: string }>;
}) {
  const t = useTranslations("settlements.list");
  const tShared = useTranslations("shared");
  const dateFnsLocale = useDateFnsLocale();
  const { format: formatAmount } = useMoney();
  const { data: currentUser } = useConvexQuery(api.users.me);

  if (!settlements || !settlements.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t("empty")}
        </CardContent>
      </Card>
    );
  }

  const getUserDetails = (userId: Id<"users">) => {
    return {
      name:
        userId === currentUser?.id
          ? tShared("you")
          : userLookupMap[userId]?.name || tShared("otherUser"),
      imageUrl: null,
      id: userId,
    };
  };

  return (
    <div className="flex flex-col gap-4">
      {settlements.map((settlement: SettlementListItem) => {
        const payer = getUserDetails(settlement.paidByUserId);
        const receiver = getUserDetails(settlement.receivedByUserId);
        const isCurrentUserPayer = settlement.paidByUserId === currentUser?.id;
        const isCurrentUserReceiver =
          settlement.receivedByUserId === currentUser?.id;

        return (
          <Card
            className="hover:bg-muted/30 transition-colors"
            key={settlement._id}
          >
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <ArrowLeftRight className="h-5 w-5 text-primary" />
                  </div>

                  <div>
                    <h3 className="font-medium">
                      {isCurrentUserPayer
                        ? t("youPaidReceiver", { name: receiver.name })
                        : isCurrentUserReceiver
                          ? t("payerPaidYou", { payer: payer.name })
                          : t("payerPaidReceiver", {
                              payer: payer.name,
                              receiver: receiver.name,
                            })}
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <span>
                        {formatDate(new Date(settlement.date), "d.M.yyyy", {
                          locale: dateFnsLocale,
                        })}
                      </span>
                      {settlement.note && (
                        <>
                          <span>•</span>
                          <span>{settlement.note}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-medium">
                    {formatAmount(settlement.amount, settlement.currency)}
                  </div>
                  {isGroupSettlement ? (
                    <Badge variant="outline" className="mt-1">
                      {t("groupSettlementBadge")}
                    </Badge>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {isCurrentUserPayer ? (
                        <span className="text-amber-600">
                          {t("youPaidLabel")}
                        </span>
                      ) : isCurrentUserReceiver ? (
                        <span className="text-green-600">
                          {t("youReceivedLabel")}
                        </span>
                      ) : (
                        <span>{t("paymentLabel")}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
