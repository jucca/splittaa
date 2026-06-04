#!/usr/bin/env node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, "..", "messages");

function flattenKeys(obj, prefix = "") {
  /** @type {string[]} */
  const keys = [];
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      keys.push(...flattenKeys(value, full));
    } else {
      keys.push(full);
    }
  }
  return keys.sort();
}

const files = fs
  .readdirSync(messagesDir)
  .filter((f) => f.endsWith(".json"))
  .sort();

if (files.length < 2) {
  console.error("check:i18n — need at least two locale files in messages/");
  process.exit(1);
}

const byFile = Object.fromEntries(
  files.map((file) => {
    const data = JSON.parse(
      fs.readFileSync(path.join(messagesDir, file), "utf8")
    );
    return [file, new Set(flattenKeys(data))];
  })
);

const reference = files[0];
const refKeys = byFile[reference];
let failed = false;

for (const file of files.slice(1)) {
  const keys = byFile[file];
  for (const key of refKeys) {
    if (!keys.has(key)) {
      console.error(`[${file}] missing key: ${key}`);
      failed = true;
    }
  }
  for (const key of keys) {
    if (!refKeys.has(key)) {
      console.error(`[${file}] extra key (not in ${reference}): ${key}`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}

console.log(`check:i18n OK (${files.length} locales, ${refKeys.size} keys each)`);
