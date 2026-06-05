"use client";

import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { useMoney } from "@/components/providers/money-format-provider";
import { SendDebtRequestButton } from "@/components/features/debt-requests/send-debt-request-button";
import type { Id } from "@/convex/_generated/dataModel";
import type { UserBalances } from "@/lib/types/domain";
import { useTranslations } from "next-intl";

type BalanceItem = {
  userId: string;
  name: string;
  amount: number;
  imageUrl?: string | null;
};

export function BalanceSummary({
  balances,
}: {
  balances: UserBalances | null | undefined;
}) {
  const t = useTranslations("dashboard");
  const { format } = useMoney();

  if (!balances) return null;

  const { oweDetails } = balances;
  const hasOwed = oweDetails.youAreOwedBy.length > 0;
  const hasOwing = oweDetails.youOwe.length > 0;

  return (
    <div className="space-y-4">
      {!hasOwed && !hasOwing && (
        <div className="text-center py-6">
          <p className="text-muted-foreground">{t("balanceAllSettled")}</p>
        </div>
      )}

      {hasOwed && (
        <div>
          <h3 className="text-sm font-medium flex items-center mb-3">
            <ArrowUpCircle className="h-4 w-4 text-green-500 mr-2" />
            {t("balanceOwedToYou")}
          </h3>
          <div className="space-y-3">
            {oweDetails.youAreOwedBy.map((item: BalanceItem) => (
              <div
                key={item.userId}
                className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between hover:bg-muted p-2 rounded-md transition-colors"
              >
                <Link
                  href={`/person/${item.userId}`}
                  className="flex items-center justify-between flex-1 min-w-0 gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarImage src={item.imageUrl ?? undefined} />
                      <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm truncate">{item.name}</span>
                  </div>
                  <span className="font-medium text-green-600 shrink-0">
                    {format(item.amount)}
                  </span>
                </Link>
                <SendDebtRequestButton
                  debtorUserId={item.userId as Id<"users">}
                  debtorName={item.name}
                  amount={item.amount}
                  className="w-full sm:w-auto shrink-0"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {hasOwing && (
        <div>
          <h3 className="text-sm font-medium flex items-center mb-3">
            <ArrowDownCircle className="h-4 w-4 text-red-500 mr-2" />
            {t("balanceYouOwe")}
          </h3>
          <div className="space-y-3">
            {oweDetails.youOwe.map((item: BalanceItem) => (
              <Link
                href={`/person/${item.userId}`}
                key={item.userId}
                className="flex items-center justify-between hover:bg-muted p-2 rounded-md transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={item.imageUrl ?? undefined} />
                    <AvatarFallback>{item.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm">{item.name}</span>
                </div>
                <span className="font-medium text-red-600">
                  {format(item.amount)}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
