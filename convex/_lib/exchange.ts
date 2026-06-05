import { convertAmount } from "../../lib/money/convert";
import type { SupportedCurrencyCode } from "./currencies";
import { DEFAULT_CURRENCY } from "./currencies";
import type { MutationCtx, QueryCtx } from "../_generated/server";

type Ctx = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;

export async function getEurBasedRates(ctx: Ctx): Promise<Record<string, number>> {
  const row = await ctx.db.query("exchangeRates").first();
  if (!row) {
    return { EUR: 1 };
  }
  return row.rates as Record<string, number>;
}

export async function convertWithStoredRates(
  ctx: Ctx,
  amount: number,
  from: SupportedCurrencyCode,
  to: SupportedCurrencyCode
): Promise<number> {
  const rates = await getEurBasedRates(ctx);
  return convertAmount(amount, from, to, rates);
}

export function balanceCurrency(row: { currency?: string | null }): SupportedCurrencyCode {
  if (row.currency && typeof row.currency === "string") {
    return row.currency as SupportedCurrencyCode;
  }
  return DEFAULT_CURRENCY;
}
