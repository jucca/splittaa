import { convexTest } from "convex-test";
import { expect } from "vitest";
import { api } from "../../convex/_generated/api";
import { convexModules, schema } from "./setup";

export function createTestConvex() {
  return convexTest(schema, convexModules);
}

export type TestContext = ReturnType<typeof createTestConvex>;

export async function createTestUser(
  t: TestContext,
  label: string
): Promise<{
  asUser: TestContext;
  userId: Awaited<ReturnType<TestContext["mutation"]>>;
  tokenIdentifier: string;
}> {
  const tokenIdentifier = `test|${label}`;
  const asUser = t.withIdentity({
    tokenIdentifier,
    subject: tokenIdentifier,
    name: `User ${label}`,
    email: `${label}@test.example`,
  });
  const userId = await asUser.mutation(api.users.store, {});
  return { asUser, userId, tokenIdentifier };
}

export function expectConvexError(
  error: unknown,
  code: string
): void {
  expect(error).toBeInstanceOf(Error);
  const data = (error as { data?: { code?: string } }).data;
  expect(data?.code).toBe(code);
}
