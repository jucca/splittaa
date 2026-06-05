import { v } from "convex/values";
import { action, internalMutation, query } from "./_generated/server";
import { internal } from "./_generated/api";
import { SUPPORTED_CURRENCY_CODES } from "./_lib/currencies";

const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const FRANKFURTER_URL = "https://api.frankfurter.app/latest";

export const getCached = query({
  args: {},
  handler: async (ctx) => {
    const row = await ctx.db.query("exchangeRates").first();
    if (!row) return null;
    return {
      rates: row.rates as Record<string, number>,
      fetchedAt: row.fetchedAt,
      stale: Date.now() - row.fetchedAt > CACHE_TTL_MS,
    };
  },
});

export const refresh = action({
  args: {},
  handler: async (ctx) => {
    const targets = SUPPORTED_CURRENCY_CODES.filter((c) => c !== "EUR").join(",");
    const response = await fetch(`${FRANKFURTER_URL}?from=EUR&to=${targets}`);
    if (!response.ok) {
      throw new Error("Kurssien haku epäonnistui");
    }
    const data = (await response.json()) as {
      rates: Record<string, number>;
    };
    await ctx.runMutation(internal.exchangeRates.store, {
      rates: { EUR: 1, ...data.rates },
    });
    return { ok: true as const };
  },
});

export const store = internalMutation({
  args: { rates: v.record(v.string(), v.number()) },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("exchangeRates").first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        rates: args.rates,
        fetchedAt: Date.now(),
      });
      return;
    }
    await ctx.db.insert("exchangeRates", {
      rates: args.rates,
      fetchedAt: Date.now(),
    });
  },
});
