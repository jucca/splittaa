import { type CurrencyCode, DEFAULT_CURRENCY } from "./currencies";

/** Rates: how many units of currency X per 1 EUR (Frankfurter style). */
export type EurBasedRates = Partial<Record<CurrencyCode, number>>;

function rateFromEur(currency: CurrencyCode, rates: EurBasedRates): number {
  if (currency === DEFAULT_CURRENCY) return 1;
  const rate = rates[currency];
  if (!rate || rate <= 0) {
    throw new Error(`Missing exchange rate for ${currency}`);
  }
  return rate;
}

/** Convert amount between currencies using EUR as hub. */
export function convertAmount(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
  rates: EurBasedRates
): number {
  if (from === to) return amount;
  const amountInEur = amount / rateFromEur(from, rates);
  const converted = amountInEur * rateFromEur(to, rates);
  const digits = to === "JPY" ? 0 : 2;
  const factor = 10 ** digits;
  return Math.round(converted * factor) / factor;
}
