import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

const eurFormatter = new Intl.NumberFormat("fi-FI", {
  style: "currency",
  currency: "EUR",
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined) {
  return eurFormatter.format(amount ?? 0);
}

export function formatSignedCurrency(amount: number) {
  if (amount === 0) return formatCurrency(0);
  const sign = amount > 0 ? "+" : "-";
  return `${sign}${formatCurrency(Math.abs(amount))}`;
}
