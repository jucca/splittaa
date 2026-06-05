"use client";

import { useAction, useConvexAuth, useQuery } from "convex/react";
import { useCallback, useEffect, useMemo } from "react";
import { api } from "@/convex/_generated/api";
import { convertAmount } from "@/lib/money/convert";
import {
  formatMoney,
  formatSignedMoney,
} from "@/lib/money/format";
import {
  DEFAULT_CURRENCY,
  resolveCurrency,
  type CurrencyCode,
} from "@/lib/money/currencies";
export function useFormatMoney() {
  const { isAuthenticated } = useConvexAuth();

  const me = useQuery(api.users.me, isAuthenticated ? {} : "skip");
  const ratesQuery = useQuery(api.exchangeRates.getCached);
  const refreshRates = useAction(api.exchangeRates.refresh);

  const preferredCurrency = resolveCurrency(me?.preferredCurrency ?? undefined);

  useEffect(() => {
    if (!ratesQuery || ratesQuery.stale) {
      void refreshRates({}).catch(() => {});
    }
  }, [ratesQuery, refreshRates]);

  const rates = useMemo(
    () => (ratesQuery?.rates ?? { EUR: 1 }) as Partial<Record<CurrencyCode, number>>,
    [ratesQuery]
  );

  const toPreferred = useCallback(
    (amount: number, fromCurrency: string = DEFAULT_CURRENCY) => {
      const from = resolveCurrency(fromCurrency);
      if (from === preferredCurrency) return amount;
      try {
        return convertAmount(amount, from, preferredCurrency, rates);
      } catch {
        return amount;
      }
    },
    [preferredCurrency, rates]
  );

  const format = useCallback(
    (amount: number | null | undefined, fromCurrency?: string) => {
      const value = amount ?? 0;
      const displayAmount = fromCurrency
        ? toPreferred(value, fromCurrency)
        : value;
      return formatMoney(displayAmount, preferredCurrency);
    },
    [preferredCurrency, toPreferred]
  );

  const formatSigned = useCallback(
    (amount: number, fromCurrency?: string) => {
      const displayAmount = fromCurrency
        ? toPreferred(amount, fromCurrency)
        : amount;
      return formatSignedMoney(displayAmount, preferredCurrency);
    },
    [preferredCurrency, toPreferred]
  );

  return {
    preferredCurrency,
    ratesReady: Boolean(ratesQuery),
    toPreferred,
    format,
    formatSigned,
  };
}
