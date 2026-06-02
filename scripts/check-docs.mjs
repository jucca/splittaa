#!/usr/bin/env node
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const root = process.cwd();
let failed = false;

function fail(msg) {
  console.error(`check-docs: ${msg}`);
  failed = true;
}

const agentsPath = join(root, "AGENTS.md");
if (!existsSync(agentsPath)) {
  fail("AGENTS.md is missing");
} else {
  const agents = readFileSync(agentsPath, "utf8");
  const lineCount = agents.split("\n").length;
  if (lineCount > 120) {
    fail(`AGENTS.md has ${lineCount} lines (max 120)`);
  }

  const linkRe = /\]\((docs\/[^)#]+\.md)\)/g;
  let match;
  while ((match = linkRe.exec(agents)) !== null) {
    const target = join(root, match[1]);
    if (!existsSync(target)) {
      fail(`broken link in AGENTS.md: ${match[1]}`);
    }
  }
}

const requiredDocs = [
  "ARCHITECTURE.md",
  "docs/SECURITY.md",
  "docs/FRONTEND.md",
  "docs/CONVEX.md",
  "docs/RELIABILITY.md",
  "docs/DEPLOYMENT.md",
  "docs/DOC_GARDENING.md",
  "docs/PLANS.md",
  "docs/QUALITY_SCORE.md",
];

for (const doc of requiredDocs) {
  if (!existsSync(join(root, doc))) {
    fail(`missing required doc: ${doc}`);
  }
}

if (failed) {
  process.exit(1);
}

console.log("check-docs: OK");
