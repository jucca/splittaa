export const SUPPORTED_CURRENCY_CODES = [
  "EUR",
  "GBP",
  "USD",
  "SEK",
  "NOK",
  "JPY",
  "CHF",
  "INR",
  "THB",
  "PLN",
] as const;

export type SupportedCurrencyCode = (typeof SUPPORTED_CURRENCY_CODES)[number];

export const DEFAULT_CURRENCY: SupportedCurrencyCode = "EUR";

export function isSupportedCurrency(
  value: string
): value is SupportedCurrencyCode {
  return (SUPPORTED_CURRENCY_CODES as readonly string[]).includes(value);
}

export function resolveCurrency(value: string | undefined | null): SupportedCurrencyCode {
  if (value && isSupportedCurrency(value)) {
    return value;
  }
  return DEFAULT_CURRENCY;
}
