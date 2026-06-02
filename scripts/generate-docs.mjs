#!/usr/bin/env node
/**
 * Regenerate generated docs and run doc consistency checks (Phase 5 doc-gardening).
 */
import { execSync } from "node:child_process";

const steps = [
  ["generate:schema-doc", "npm run generate:schema-doc"],
  ["check:schema-doc", "npm run check:schema-doc"],
  ["check:docs", "npm run check:docs"],
];

for (const [name, cmd] of steps) {
  console.log(`generate-docs: ${name}`);
  execSync(cmd, { stdio: "inherit" });
}

console.log("generate-docs: OK");
