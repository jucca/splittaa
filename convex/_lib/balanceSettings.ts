import { v } from "convex/values";

export type BalanceSettings = {
  autoNetBalances: boolean;
};

export const balanceSettingsValidator = v.object({
  autoNetBalances: v.boolean(),
});

export function normalizeBalanceSettings(
  raw?: { autoNetBalances?: boolean } | null
): BalanceSettings {
  return {
    autoNetBalances: raw?.autoNetBalances ?? true,
  };
}
