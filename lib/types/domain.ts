import type { FunctionReturnType } from "convex/server";
import type { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

export type CurrentUser = NonNullable<FunctionReturnType<typeof api.users.me>>;

/** Participant row used in expense forms and selectors. */
export type Participant = {
  id: Id<"users">;
  name: string;
  email?: string;
  imageUrl?: string | null;
};

export type ExpenseSplit = {
  userId: Id<"users">;
  amount: number;
  percentage?: number;
  paid?: boolean;
};

/** Split row with display fields for UI selectors. */
export type SplitRow = ExpenseSplit & {
  name: string;
  email?: string;
  imageUrl?: string | null;
  percentage: number;
};

export type ExpenseCategoryOption = {
  id: string;
  name: string;
  isDefault?: boolean;
};

export type SplitType = "equal" | "percentage" | "exact";

export type UserBalances = FunctionReturnType<
  typeof api.dashboard.getUserBalances
>;

export type MonthlySpendingItem = {
  month: number;
  total: number;
};

export type DashboardGroup = NonNullable<
  FunctionReturnType<typeof api.dashboard.getUserGroups>
>[number];
