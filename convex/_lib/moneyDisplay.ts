import type { Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import { resolveCurrency, type SupportedCurrencyCode } from "./currencies";
import { balanceCurrency, convertWithStoredRates } from "./exchange";

type Ctx = Pick<QueryCtx, "db"> | Pick<MutationCtx, "db">;

export function viewerCurrency(user: {
  preferredCurrency?: string | null;
}): SupportedCurrencyCode {
  return resolveCurrency(user.preferredCurrency);
}

export async function convertToViewer(
  ctx: Ctx,
  viewerCur: SupportedCurrencyCode,
  amount: number,
  fromCurrency: SupportedCurrencyCode
): Promise<number> {
  if (fromCurrency === viewerCur) return amount;
  return convertWithStoredRates(ctx, amount, fromCurrency, viewerCur);
}

export async function signedBalanceForViewer(
  ctx: Ctx,
  viewerId: Id<"users">,
  viewerCur: SupportedCurrencyCode,
  row: {
    userId: Id<"users">;
    counterpartyUserId: Id<"users">;
    amount: number;
    currency?: string | null;
  }
): Promise<number> {
  const currency = balanceCurrency(row);
  const signed = row.userId === viewerId ? -row.amount : row.amount;
  const converted = await convertToViewer(
    ctx,
    viewerCur,
    Math.abs(signed),
    currency
  );
  return signed >= 0 ? converted : -converted;
}
