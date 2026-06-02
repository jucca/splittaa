import { describe, expect, it } from "vitest";
import { api } from "../../convex/_generated/api";
import { createTestConvex, expectConvexError } from "./helpers";

describe("authentication", () => {
  const t = createTestConvex();

  it("rejects unauthenticated createGroup", async () => {
    try {
      await t.mutation(api.contacts.createGroup, {
        name: "Test",
        members: [],
      });
      expect.fail("should throw");
    } catch (error) {
      expectConvexError(error, "UNAUTHENTICATED");
    }
  });

  it("rejects unauthenticated users.me", async () => {
    try {
      await t.query(api.users.me);
      expect.fail("should throw");
    } catch (error) {
      expectConvexError(error, "UNAUTHENTICATED");
    }
  });

  it("rejects unauthenticated users.searchUsers", async () => {
    try {
      await t.query(api.users.searchUsers, { query: "ab" });
      expect.fail("should throw");
    } catch (error) {
      expectConvexError(error, "UNAUTHENTICATED");
    }
  });

  it("rejects unauthenticated getAllContacts", async () => {
    try {
      await t.query(api.contacts.getAllContacts);
      expect.fail("should throw");
    } catch (error) {
      expectConvexError(error, "UNAUTHENTICATED");
    }
  });
});
