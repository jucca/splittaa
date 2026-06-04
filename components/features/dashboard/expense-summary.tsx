"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import type { MonthlySpendingItem } from "@/lib/types/domain";
import { useTranslations } from "next-intl";

const MONTH_KEYS = [
  "jan",
  "feb",
  "mar",
  "apr",
  "may",
  "jun",
  "jul",
  "aug",
  "sep",
  "oct",
  "nov",
  "dec",
] as const;

export function ExpenseSummary({
  monthlySpending,
  totalSpent,
}: {
  monthlySpending: MonthlySpendingItem[] | null | undefined;
  totalSpent: number | null | undefined;
}) {
  const t = useTranslations("dashboard");
  const tShared = useTranslations("shared");

  const chartData =
    monthlySpending?.map((item: MonthlySpendingItem) => {
      const date = new Date(item.month);
      const monthKey = MONTH_KEYS[date.getMonth()];
      return {
        name: t(`monthShort.${monthKey}`),
        amount: item.total,
      };
    }) || [];

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("expenseSummaryTitle")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              {t("totalThisMonth")}
            </p>
            <h3 className="text-2xl font-bold mt-1">
              {formatCurrency(monthlySpending?.[currentMonth]?.total || 0)}
            </h3>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              {t("totalThisYear")}
            </p>
            <h3 className="text-2xl font-bold mt-1">
              {formatCurrency(totalSpent || 0)}
            </h3>
          </div>
        </div>

        <div className="h-64 mt-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip
                formatter={(value) => [
                  formatCurrency(typeof value === "number" ? value : Number(value)),
                  tShared("sumLabel"),
                ]}
                labelFormatter={() => tShared("consumptionLabel")}
              />
              <Bar dataKey="amount" fill="#36d7b7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          {t("monthlySpendingCaption", { year: currentYear })}
        </p>
      </CardContent>
    </Card>
  );
}
