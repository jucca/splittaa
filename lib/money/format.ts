import {
  getCurrencyDefinition,
  resolveCurrency,
  type CurrencyCode,
} from "./currencies";

export function formatMoney(
  amount: number | null | undefined,
  currency: string | CurrencyCode = "EUR"
): string {
  const code = resolveCurrency(currency);
  const { formatLocale, fractionDigits } = getCurrencyDefinition(code);
  return new Intl.NumberFormat(formatLocale, {
    style: "currency",
    currency: code,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(amount ?? 0);
}

export function formatSignedMoney(
  amount: number,
  currency: string | CurrencyCode = "EUR"
): string {
  if (amount === 0) return formatMoney(0, currency);
  const sign = amount > 0 ? "+" : "-";
  return `${sign}${formatMoney(Math.abs(amount), currency)}`;
}
