"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCategoryById } from "@/lib/expense-categories";
import { formatCurrency } from "@/lib/utils";

type SpendingPeriod = "week" | "month" | "year";

const PERIOD_LABELS: Record<SpendingPeriod, string> = {
  week: "Viikko",
  month: "Kuukausi",
  year: "Vuosi",
};

const MONTH_NAMES = [
  "tammikuu",
  "helmikuu",
  "maaliskuu",
  "huhtikuu",
  "toukokuu",
  "kesäkuu",
  "heinäkuu",
  "elokuu",
  "syyskuu",
  "lokakuu",
  "marraskuu",
  "joulukuu",
];

function monthDayTooltipLabel(dayLabel: string): string {
  const day = Number.parseInt(dayLabel, 10);
  const now = new Date();
  if (!Number.isFinite(day)) return dayLabel;
  return `${day}. ${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
}

function periodChartCaption(period: SpendingPeriod): string | null {
  const now = new Date();
  if (period === "month") {
    return `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()} — jokainen päivä`;
  }
  if (period === "year") {
    return `Vuosi ${now.getFullYear()}`;
  }
  return "Kuluva viikko (ma–su)";
}

const CHART_COLORS = [
  "#36d7b7",
  "#2eb89a",
  "#26a88c",
  "#1e987e",
  "#168870",
  "#0e7862",
  "#066854",
];

export function SpendingCharts() {
  const [period, setPeriod] = useState<SpendingPeriod>("month");
  const summary = useQuery(api.activity.getSpendingSummary, { period });

  if (summary === undefined) {
    return (
      <Card data-testid="spending-charts-loading">
        <CardHeader>
          <CardTitle>Kulutusyhteenveto</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Ladataan…</p>
        </CardContent>
      </Card>
    );
  }

  const timeData = summary.byTime.map((b) => ({
    name: b.label,
    amount: b.amount,
  }));

  const categoryData = summary.byCategory.map((c) => ({
    name: getCategoryById(c.categoryId).name,
    amount: c.amount,
  }));

  const isEmpty = summary.totalAmount === 0;

  return (
    <Card>
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Kulutusyhteenveto</CardTitle>
          <Tabs
            value={period}
            onValueChange={(v) => setPeriod(v as SpendingPeriod)}
          >
            <TabsList>
              <TabsTrigger value="week" data-testid="spending-period-week">
                Viikko
              </TabsTrigger>
              <TabsTrigger value="month" data-testid="spending-period-month">
                Kuukausi
              </TabsTrigger>
              <TabsTrigger value="year" data-testid="spending-period-year">
                Vuosi
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <p className="text-sm text-muted-foreground">
          {PERIOD_LABELS[period]} — vain sinun osuutesi kuluista
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          className="bg-muted rounded-lg p-4"
          data-testid="spending-total"
        >
          <p className="text-sm text-muted-foreground">Yhteensä</p>
          <p className="text-2xl font-bold mt-1">
            {formatCurrency(summary.totalAmount)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {summary.expenseCount}{" "}
            {summary.expenseCount === 1 ? "kulu" : "kulua"}
          </p>
        </div>

        {isEmpty ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Ei kuluja valitulla jaksolla
          </p>
        ) : (
          <>
            <div
              className={period === "month" ? "h-64" : "h-56"}
              data-testid="spending-chart-time"
            >
              <p className="text-sm font-medium mb-1">Kulutus ajassa</p>
              <p className="text-xs text-muted-foreground mb-2">
                {periodChartCaption(period)}
              </p>
              {period === "month" ? (
                <div className="overflow-x-auto -mx-1 px-1 pb-1">
                  <BarChart
                    width={Math.max(timeData.length * 22, 320)}
                    height={220}
                    data={timeData}
                    margin={{ bottom: 4, left: 0, right: 8 }}
                    barCategoryGap="25%"
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis
                      dataKey="name"
                      tick={{ fontSize: 10 }}
                      interval={0}
                      height={28}
                    />
                    <YAxis tick={{ fontSize: 11 }} width={48} />
                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(
                          typeof value === "number" ? value : Number(value)
                        ),
                        "Summa",
                      ]}
                      labelFormatter={(label) => monthDayTooltipLabel(label)}
                    />
                    <Bar
                      dataKey="amount"
                      fill="#36d7b7"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeData} margin={{ bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} width={48} />
                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(
                          typeof value === "number" ? value : Number(value)
                        ),
                        "Summa",
                      ]}
                    />
                    <Bar
                      dataKey="amount"
                      fill="#36d7b7"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {categoryData.length > 0 && (
              <div className="h-56" data-testid="spending-chart-category">
                <p className="text-sm font-medium mb-2">Kategoriat</p>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={48}
                      outerRadius={72}
                      paddingAngle={2}
                    >
                      {categoryData.map((_, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        formatCurrency(
                          typeof value === "number" ? value : Number(value)
                        ),
                        "Summa",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <ul className="flex flex-wrap gap-x-4 gap-y-1 justify-center mt-2 text-xs text-muted-foreground">
                  {categoryData.map((c, index) => (
                    <li key={c.name} className="flex items-center gap-1">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{
                          backgroundColor:
                            CHART_COLORS[index % CHART_COLORS.length],
                        }}
                      />
                      {c.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
