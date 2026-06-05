/** ISO 4217 codes supported in Splittaa. */

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

export type CurrencyCode = (typeof SUPPORTED_CURRENCY_CODES)[number];

export const DEFAULT_CURRENCY: CurrencyCode = "EUR";

export type CurrencyDefinition = {
  code: CurrencyCode;
  label: string;
  symbol: string;
  /** BCP 47 locale for Intl.NumberFormat */
  formatLocale: string;
  /** 0 for JPY etc. */
  fractionDigits: number;
};

export const SUPPORTED_CURRENCIES: readonly CurrencyDefinition[] = [
  { code: "EUR", label: "Euro", symbol: "€", formatLocale: "fi-FI", fractionDigits: 2 },
  { code: "GBP", label: "Punta", symbol: "£", formatLocale: "en-GB", fractionDigits: 2 },
  { code: "USD", label: "Yhdysvaltain dollari", symbol: "$", formatLocale: "en-US", fractionDigits: 2 },
  { code: "SEK", label: "Ruotsin kruunu", symbol: "kr", formatLocale: "sv-SE", fractionDigits: 2 },
  { code: "NOK", label: "Norjan kruunu", symbol: "kr", formatLocale: "nb-NO", fractionDigits: 2 },
  { code: "JPY", label: "Japanin jeni", symbol: "¥", formatLocale: "ja-JP", fractionDigits: 0 },
  { code: "CHF", label: "Sveitsin frangi", symbol: "CHF", formatLocale: "de-CH", fractionDigits: 2 },
  { code: "INR", label: "Intian rupia", symbol: "₹", formatLocale: "en-IN", fractionDigits: 2 },
  { code: "THB", label: "Thaimaan baht", symbol: "฿", formatLocale: "th-TH", fractionDigits: 2 },
  { code: "PLN", label: "Puolan zloty", symbol: "zł", formatLocale: "pl-PL", fractionDigits: 2 },
] as const;

const currencyByCode = new Map(
  SUPPORTED_CURRENCIES.map((c) => [c.code, c])
);

export function isSupportedCurrency(value: string): value is CurrencyCode {
  return (SUPPORTED_CURRENCY_CODES as readonly string[]).includes(value);
}

export function resolveCurrency(value: string | undefined | null): CurrencyCode {
  if (value && isSupportedCurrency(value)) {
    return value;
  }
  return DEFAULT_CURRENCY;
}

export function getCurrencyDefinition(code: CurrencyCode): CurrencyDefinition {
  const definition = currencyByCode.get(code);
  if (!definition) {
    throw new Error(`Unsupported currency: ${code}`);
  }
  return definition;
}
