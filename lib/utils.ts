import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  formatMoney,
  formatSignedMoney,
} from "@/lib/money/format";
import { DEFAULT_CURRENCY } from "@/lib/money/currencies";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** @deprecated Prefer useFormatMoney() for viewer currency; defaults to EUR. */
export function formatCurrency(
  amount: number | null | undefined,
  currency: string = DEFAULT_CURRENCY
) {
  return formatMoney(amount, currency);
}

export function formatSignedCurrency(
  amount: number,
  currency: string = DEFAULT_CURRENCY
) {
  return formatSignedMoney(amount, currency);
}
