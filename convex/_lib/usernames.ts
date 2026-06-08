export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const DISPLAY_NAME_MAX_LENGTH = 50;
export const USERNAME_CHANGE_COOLDOWN_MS = 30 * 24 * 60 * 60 * 1000;

const USERNAME_REGEX = /^[a-z0-9_]+$/;

const RESERVED_USERNAMES = new Set([
  "admin",
  "api",
  "support",
  "splittaa",
  "me",
  "null",
  "undefined",
  "profiili",
  "settings",
  "asetukset",
]);

export type UsernameValidationCode =
  | "TOO_SHORT"
  | "TOO_LONG"
  | "INVALID_CHARS"
  | "RESERVED";

export function normalizeUsername(raw: string): string {
  return raw.trim().replace(/^@+/, "").toLowerCase();
}

export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username);
}

export function validateUsername(
  raw: string
): { ok: true } | { ok: false; code: UsernameValidationCode } {
  const username = normalizeUsername(raw);
  if (username.length < USERNAME_MIN_LENGTH) {
    return { ok: false, code: "TOO_SHORT" };
  }
  if (username.length > USERNAME_MAX_LENGTH) {
    return { ok: false, code: "TOO_LONG" };
  }
  if (!USERNAME_REGEX.test(username)) {
    return { ok: false, code: "INVALID_CHARS" };
  }
  if (isReservedUsername(username)) {
    return { ok: false, code: "RESERVED" };
  }
  return { ok: true };
}

export function validateDisplayName(raw: string): boolean {
  const name = raw.trim();
  return name.length >= 1 && name.length <= DISPLAY_NAME_MAX_LENGTH;
}

export function slugifyUsernameSuggestion(source: string): string {
  const base = source
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ä/g, "a")
    .replace(/ö/g, "o")
    .replace(/å/g, "a")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_")
    .slice(0, USERNAME_MAX_LENGTH);

  const validated = validateUsername(base);
  if (validated.ok) return base;
  if (base.length >= USERNAME_MIN_LENGTH) {
    return base.slice(0, USERNAME_MAX_LENGTH - 2);
  }
  return "kayttaja";
}

export function withNumericSuffix(base: string, n: number): string {
  const suffix = String(n);
  const trimmed = base.slice(
    0,
    Math.max(USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH - suffix.length)
  );
  return `${trimmed}${suffix}`;
}
