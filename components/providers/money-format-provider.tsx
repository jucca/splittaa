"use client";

import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useFormatMoney } from "@/hooks/use-format-money";
import { MoneyFormatErrorBoundary } from "@/components/providers/money-format-error-boundary";
import {
  DEFAULT_CURRENCY,
  getCurrencyDefinition,
  type CurrencyCode,
} from "@/lib/money/currencies";
import { formatMoney, formatSignedMoney } from "@/lib/money/format";

type MoneyFormatContextValue = {
  preferredCurrency: CurrencyCode;
  currencySymbol: string;
  format: (amount: number | null | undefined, fromCurrency?: string) => string;
  formatSigned: (amount: number, fromCurrency?: string) => string;
  toPreferred: (amount: number, fromCurrency?: string) => number;
  ratesReady: boolean;
};

const MoneyFormatContext = createContext<MoneyFormatContextValue | null>(null);

function MoneyFormatProviderInner({ children }: { children: ReactNode }) {
  const money = useFormatMoney();
  const currencySymbol = getCurrencyDefinition(money.preferredCurrency).symbol;

  return (
    <MoneyFormatContext.Provider
      value={{
        preferredCurrency: money.preferredCurrency,
        currencySymbol,
        format: money.format,
        formatSigned: money.formatSigned,
        toPreferred: money.toPreferred,
        ratesReady: money.ratesReady,
      }}
    >
      {children}
    </MoneyFormatContext.Provider>
  );
}

/** Fallback when exchangeRates query is unavailable (no auth, no conversion). */
function MoneyFormatFallback({ children }: { children: ReactNode }) {
  const preferredCurrency = DEFAULT_CURRENCY;
  const currencySymbol = getCurrencyDefinition(preferredCurrency).symbol;

  const format = useCallback(
    (amount: number | null | undefined) =>
      formatMoney(amount ?? 0, preferredCurrency),
    [preferredCurrency]
  );

  const formatSigned = useCallback(
    (amount: number) => formatSignedMoney(amount, preferredCurrency),
    [preferredCurrency]
  );

  const toPreferred = useCallback((amount: number) => amount, []);

  return (
    <MoneyFormatContext.Provider
      value={{
        preferredCurrency,
        currencySymbol,
        format,
        formatSigned,
        toPreferred,
        ratesReady: false,
      }}
    >
      {children}
    </MoneyFormatContext.Provider>
  );
}

export function MoneyFormatProvider({ children }: { children: ReactNode }) {
  return (
    <MoneyFormatErrorBoundary
      fallback={<MoneyFormatFallback>{children}</MoneyFormatFallback>}
    >
      <MoneyFormatProviderInner>{children}</MoneyFormatProviderInner>
    </MoneyFormatErrorBoundary>
  );
}

export function useMoney(): MoneyFormatContextValue {
  const ctx = useContext(MoneyFormatContext);
  if (!ctx) {
    throw new Error("useMoney must be used within MoneyFormatProvider");
  }
  return ctx;
}
