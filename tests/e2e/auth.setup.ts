/**
 * Optional Clerk session bootstrap for E2E.
 *
 * 1. Sign in manually once and export storage: npx playwright codegen --save-storage=tests/e2e/.auth/user.json
 * 2. Run authenticated specs: E2E_CLERK_STORAGE=tests/e2e/.auth/user.json npm run test:e2e
 *
 * CI: provide CLERK_PUBLISHABLE_KEY + test user via Clerk testing tokens when ready.
 */
import { test as setup } from "@playwright/test";

setup("auth placeholder", async () => {
  setup.skip(
    !process.env.E2E_CLERK_STORAGE,
    "Configure E2E_CLERK_STORAGE for authenticated flows"
  );
});
