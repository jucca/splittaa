import { ConvexError, v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import { requireAuth } from "./_lib/auth";
import { isSupportedLocale } from "./_lib/locales";
import { isSupportedCurrency } from "./_lib/currencies";
import {
  normalizeUsername,
  slugifyUsernameSuggestion,
  USERNAME_CHANGE_COOLDOWN_MS,
  validateDisplayName,
  validateUsername,
  withNumericSuffix,
} from "./_lib/usernames";
import type { Doc, Id } from "./_generated/dataModel";

async function isUsernameTaken(
  ctx: QueryCtx,
  username: string,
  exceptUserId?: Id<"users">
): Promise<boolean> {
  const existing = await ctx.db
    .query("users")
    .withIndex("by_username", (q) => q.eq("username", username))
    .unique();
  if (!existing) return false;
  if (exceptUserId && existing._id === exceptUserId) return false;
  return true;
}

async function findAvailableUsername(
  ctx: QueryCtx,
  base: string
): Promise<string> {
  const normalized = normalizeUsername(base);
  if (validateUsername(normalized).ok && !(await isUsernameTaken(ctx, normalized))) {
    return normalized;
  }
  for (let i = 2; i <= 100; i++) {
    const candidate = withNumericSuffix(slugifyUsernameSuggestion(base), i);
    if (validateUsername(candidate).ok && !(await isUsernameTaken(ctx, candidate))) {
      return candidate;
    }
  }
  return `user${Date.now().toString(36).slice(-8)}`;
}

function formatUserSearchResult(user: {
  _id: Id<"users">;
  name: string;
  username?: string;
  imageUrl?: string;
}) {
  return {
    id: user._id,
    name: user.name,
    username: user.username ?? null,
    imageUrl: user.imageUrl,
  };
}

export const store = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Käyttäjän tallennus epäonnistui: tunnistautuminen puuttuu");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();
    if (user !== null) {
      const patch: {
        email?: string;
        imageUrl?: string;
        name?: string;
      } = {};
      const email = identity.email ?? "";
      if (user.email !== email) patch.email = email;
      if (user.imageUrl !== identity.pictureUrl) {
        patch.imageUrl = identity.pictureUrl;
      }
      if (!user.profileCompletedAt && user.name !== identity.name) {
        patch.name = identity.name ?? user.name;
      }
      if (Object.keys(patch).length > 0) {
        await ctx.db.patch(user._id, patch);
      }
      return user._id;
    }

    return await ctx.db.insert("users", {
      name: identity.name ?? "Anonymous",
      tokenIdentifier: identity.tokenIdentifier,
      email: identity.email ?? "",
      imageUrl: identity.pictureUrl,
    });
  },
});

export const me = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    return {
      id: user._id,
      name: user.name,
      username: user.username ?? null,
      imageUrl: user.imageUrl ?? null,
      profileCompleted: !!user.profileCompletedAt,
      usernameChangeAllowedAt: user.usernameChangedAt
        ? user.usernameChangedAt + USERNAME_CHANGE_COOLDOWN_MS
        : null,
      preferredLocale: user.preferredLocale ?? null,
      preferredCurrency: user.preferredCurrency ?? null,
    };
  },
});

export const suggestUsername = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireAuth(ctx);
    const identity = await ctx.auth.getUserIdentity();
    const source = identity?.name ?? user.name ?? "kayttaja";
    const base = slugifyUsernameSuggestion(source);
    const username = await findAvailableUsername(ctx, base);
    return { username };
  },
});

export const isUsernameAvailable = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    const username = normalizeUsername(args.username);
    const validation = validateUsername(username);
    if (!validation.ok) {
      return { available: false };
    }
    const taken = await isUsernameTaken(ctx, username, user._id);
    return { available: !taken };
  },
});

export const completeProfile = mutation({
  args: {
    displayName: v.string(),
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    if (user.profileCompletedAt) {
      throw new ConvexError({
        code: "PROFILE_ALREADY_COMPLETE",
        message: "Profiili on jo valmis",
      });
    }

    const displayName = args.displayName.trim();
    if (!validateDisplayName(displayName)) {
      throw new ConvexError({
        code: "INVALID_DISPLAY_NAME",
        message: "Virheellinen näyttönimi",
      });
    }

    const username = normalizeUsername(args.username);
    const validation = validateUsername(username);
    if (!validation.ok) {
      throw new ConvexError({
        code: "INVALID_USERNAME",
        message: "Virheellinen käyttäjänimi",
      });
    }

    if (await isUsernameTaken(ctx, username)) {
      throw new ConvexError({
        code: "USERNAME_TAKEN",
        message: "Käyttäjänimi on jo käytössä",
      });
    }

    const now = Date.now();
    await ctx.db.patch(user._id, {
      name: displayName,
      username,
      profileCompletedAt: now,
      usernameChangedAt: now,
    });
    return { username };
  },
});

export const updateDisplayName = mutation({
  args: { displayName: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    if (!user.profileCompletedAt) {
      throw new ConvexError({
        code: "PROFILE_INCOMPLETE",
        message: "Profiili on kesken",
      });
    }

    const displayName = args.displayName.trim();
    if (!validateDisplayName(displayName)) {
      throw new ConvexError({
        code: "INVALID_DISPLAY_NAME",
        message: "Virheellinen näyttönimi",
      });
    }

    await ctx.db.patch(user._id, { name: displayName });
    return { name: displayName };
  },
});

export const updateUsername = mutation({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    if (!user.profileCompletedAt) {
      throw new ConvexError({
        code: "PROFILE_INCOMPLETE",
        message: "Profiili on kesken",
      });
    }

    if (
      user.usernameChangedAt &&
      Date.now() - user.usernameChangedAt < USERNAME_CHANGE_COOLDOWN_MS
    ) {
      throw new ConvexError({
        code: "USERNAME_RATE_LIMITED",
        message: "Käyttäjänimen voi vaihtaa vain kerran 30 päivässä",
      });
    }

    const username = normalizeUsername(args.username);
    const validation = validateUsername(username);
    if (!validation.ok) {
      throw new ConvexError({
        code: "INVALID_USERNAME",
        message: "Virheellinen käyttäjänimi",
      });
    }

    if (user.username === username) {
      return { username };
    }

    if (await isUsernameTaken(ctx, username, user._id)) {
      throw new ConvexError({
        code: "USERNAME_TAKEN",
        message: "Käyttäjänimi on jo käytössä",
      });
    }

    const now = Date.now();
    await ctx.db.patch(user._id, {
      username,
      usernameChangedAt: now,
    });
    return { username };
  },
});

export const updatePreferredCurrency = mutation({
  args: { currency: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    if (!isSupportedCurrency(args.currency)) {
      throw new Error("Invalid currency");
    }
    await ctx.db.patch(user._id, { preferredCurrency: args.currency });
    return { currency: args.currency };
  },
});

export const updatePreferredLocale = mutation({
  args: { locale: v.string() },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx);
    if (!isSupportedLocale(args.locale)) {
      throw new Error("Invalid locale");
    }
    await ctx.db.patch(user._id, { preferredLocale: args.locale });
    return { locale: args.locale };
  },
});

export const searchUsers = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const currentUser = await requireAuth(ctx);

    if (args.query.length < 2) {
      return [];
    }

    const nameResults = await ctx.db
      .query("users")
      .withSearchIndex("search_name", (q) => q.search("name", args.query))
      .collect();

    let usernameResults: Doc<"users">[] = [];
    try {
      usernameResults = await ctx.db
        .query("users")
        .withSearchIndex("search_username", (q) =>
          q.search("username", args.query)
        )
        .collect();
    } catch {
      // convex-test does not index optional username reliably
      usernameResults = [];
    }

    const emailResults = await ctx.db
      .query("users")
      .withSearchIndex("search_email", (q) => q.search("email", args.query))
      .collect();

    const seen = new Set<string>();
    const users = [...nameResults, ...usernameResults, ...emailResults].filter(
      (user) => {
        if (seen.has(user._id)) return false;
        seen.add(user._id);
        return true;
      }
    );

    return users
      .filter((user) => user._id !== currentUser._id)
      .map(formatUserSearchResult);
  },
});
