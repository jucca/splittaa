"use client";

import { useMemo } from "react";
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
import type { TooltipProps } from "recharts";
import { useMoney } from "@/components/providers/money-format-provider";
import type { MonthlySpendingItem } from "@/lib/types/domain";
import { useTranslations } from "next-intl";
import {
  CATEGORY_IDS,
  getCategoryColor,
  type ExpenseCategoryId,
} from "@/lib/expense-categories";
import { getCategoryLabel } from "@/lib/i18n/category-label";

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

const TOP_STACK_CATEGORY_ID = CATEGORY_IDS[CATEGORY_IDS.length - 1];

export function ExpenseSummary({
  monthlySpending,
  totalSpent,
}: {
  monthlySpending: MonthlySpendingItem[] | null | undefined;
  totalSpent: number | null | undefined;
}) {
  const t = useTranslations("dashboard");
  const tShared = useTranslations("shared");
  const tCategories = useTranslations("categories");
  const { format } = useMoney();

  const chartData = useMemo(() => {
    return (
      monthlySpending?.map((item: MonthlySpendingItem) => {
        const date = new Date(item.month);
        const monthKey = MONTH_KEYS[date.getMonth()];
        const byCategoryMap = new Map(
          item.byCategory.map((c) => [c.categoryId, c.amount]),
        );
        const categories = Object.fromEntries(
          CATEGORY_IDS.map((id) => [id, byCategoryMap.get(id) ?? 0]),
        ) as Record<ExpenseCategoryId, number>;
        return {
          name: t(`monthShort.${monthKey}`),
          ...categories,
        };
      }) ?? []
    );
  }, [monthlySpending, t]);

  const renderTooltip = (props: TooltipProps<number, string>) => {
    const { active, payload, label } = props;
    if (!active || !payload?.length) return null;

    const entries = payload
      .filter((p) => typeof p.value === "number" && p.value > 0)
      .sort((a, b) => (b.value as number) - (a.value as number));

    const total = payload.reduce(
      (sum, p) => sum + (typeof p.value === "number" ? p.value : 0),
      0,
    );

    return (
      <div className="rounded-lg border bg-background p-3 text-sm shadow-lg">
        <p className="mb-2 font-medium">{label}</p>
        <ul className="space-y-1">
          {entries.map((entry) => (
            <li key={entry.dataKey} className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="flex-1">
                {getCategoryLabel(tCategories, String(entry.dataKey))}
              </span>
              <span className="font-medium">{format(entry.value as number)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2 flex justify-between border-t pt-2 font-medium">
          <span>{tShared("sumLabel")}</span>
          <span>{format(total)}</span>
        </p>
      </div>
    );
  };

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
              {format(monthlySpending?.[currentMonth]?.total || 0)}
            </h3>
          </div>
          <div className="bg-muted rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              {t("totalThisYear")}
            </p>
            <h3 className="text-2xl font-bold mt-1">
              {format(totalSpent || 0)}
            </h3>
          </div>
        </div>

        <div className="h-64 mt-6" data-testid="expense-summary-chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip content={renderTooltip} />
              {CATEGORY_IDS.map((id) => (
                <Bar
                  key={id}
                  dataKey={id}
                  stackId="month"
                  fill={getCategoryColor(id)}
                  radius={
                    id === TOP_STACK_CATEGORY_ID ? [4, 4, 0, 0] : undefined
                  }
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div
          className="mt-4 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground"
          data-testid="expense-summary-legend"
        >
          {CATEGORY_IDS.map((id) => (
            <div key={id} className="flex items-center gap-1">
              <span
                className="inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: getCategoryColor(id) }}
              />
              {getCategoryLabel(tCategories, id)}
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center mt-2">
          {t("monthlySpendingCaption", { year: currentYear })}
        </p>
      </CardContent>
    </Card>
  );
}
