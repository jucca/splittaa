import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import { createTestConvex, createTestUser } from "./helpers";

describe("users profile", () => {
  const t = createTestConvex();

  it("new user has incomplete profile", async () => {
    const { asUser } = await createTestUser(t, "new-profile");
    const me = await asUser.query(api.users.me);
    expect(me.profileCompleted).toBe(false);
    expect(me.username).toBeNull();
  });

  it("completeProfile sets username and display name", async () => {
    const { asUser } = await createTestUser(t, "complete");
    await asUser.mutation(api.users.completeProfile, {
      displayName: "Jukka Virtanen",
      username: "jukka",
    });
    const me = await asUser.query(api.users.me);
    expect(me.profileCompleted).toBe(true);
    expect(me.name).toBe("Jukka Virtanen");
    expect(me.username).toBe("jukka");
  });

  it("rejects duplicate username", async () => {
    const a = await createTestUser(t, "dup-a");
    const b = await createTestUser(t, "dup-b");
    await a.asUser.mutation(api.users.completeProfile, {
      displayName: "A",
      username: "sama",
    });
    await expect(
      b.asUser.mutation(api.users.completeProfile, {
        displayName: "B",
        username: "sama",
      })
    ).rejects.toThrow();
  });

  it("store does not overwrite name after profile complete", async () => {
    const { asUser, tokenIdentifier } = await createTestUser(t, "no-overwrite");
    await asUser.mutation(api.users.completeProfile, {
      displayName: "Oma Nimi",
      username: "oma",
    });
    const asRenamed = t.withIdentity({
      tokenIdentifier,
      subject: tokenIdentifier,
      name: "Clerk Uusi Nimi",
      email: "no-overwrite@test.example",
    });
    await asRenamed.mutation(api.users.store, {});
    const me = await asRenamed.query(api.users.me);
    expect(me.name).toBe("Oma Nimi");
  });

  it("searchUsers returns username without email", async () => {
    const { asUser } = await createTestUser(t, "search-me");
    await asUser.mutation(api.users.completeProfile, {
      displayName: "Hakija",
      username: "hakija42",
    });
    const other = await createTestUser(t, "search-other");
    await other.asUser.mutation(api.users.completeProfile, {
      displayName: "Kohde",
      username: "kohde99",
    });
    const results = await asUser.query(api.users.searchUsers, { query: "kohde" });
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ name: "Kohde", username: "kohde99" });
    expect(results[0]).not.toHaveProperty("email");
  });
});
