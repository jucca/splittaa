"use client";

import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@/convex/_generated/api";
import { format } from "date-fns";
import { fi } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeftRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { Id } from "@/convex/_generated/dataModel";

export type SettlementListItem = {
  _id: Id<"settlements">;
  amount: number;
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
  const { data: currentUser } = useConvexQuery(api.users.me);

  if (!settlements || !settlements.length) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Tilityksiä ei löytynyt
        </CardContent>
      </Card>
    );
  }

  const getUserDetails = (userId: Id<"users">) => {
    return {
      name:
        userId === currentUser?.id
          ? "Sinä"
          : userLookupMap[userId]?.name || "Muu käyttäjä",
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
                        ? `Sinä maksoit käyttäjälle ${receiver.name}`
                        : isCurrentUserReceiver
                          ? `${payer.name} maksoi sinulle`
                          : `${payer.name} maksoi käyttäjälle ${receiver.name}`}
                    </h3>
                    <div className="flex items-center text-sm text-muted-foreground gap-2">
                      <span>
                        {format(new Date(settlement.date), "d.M.yyyy", {
                          locale: fi,
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
                    {formatCurrency(settlement.amount)}
                  </div>
                  {isGroupSettlement ? (
                    <Badge variant="outline" className="mt-1">
                      Ryhmätilitys
                    </Badge>
                  ) : (
                    <div className="text-sm text-muted-foreground">
                      {isCurrentUserPayer ? (
                        <span className="text-amber-600">Sinä maksoit</span>
                      ) : isCurrentUserReceiver ? (
                        <span className="text-green-600">Sinä sait</span>
                      ) : (
                        <span>Maksu</span>
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
