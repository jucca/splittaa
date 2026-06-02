import { ConvexError } from "convex/values";

/** Shared secret for Inngest bridge and automated email actions. */
export function assertAutomationSecret(secret: string): void {
  const expected = process.env.INNGEST_CONVEX_SECRET;
  if (!expected || secret !== expected) {
    throw new ConvexError({ code: "FORBIDDEN", message: "Forbidden" });
  }
}
