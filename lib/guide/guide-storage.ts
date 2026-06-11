import type { GuideExperience, GuideStepId, GuideUseCaseTag } from "./types";
import { GUIDE_USE_CASE_TAGS } from "./types";

export const GUIDE_STORAGE_KEYS = {
  completed: "splittaa-guide-completed",
  step: "splittaa-guide-step",
  autoOpened: "splittaa-guide-auto-opened",
  useCases: "splittaa-guide-use-cases",
  useCaseCustom: "splittaa-guide-use-case-custom",
  experience: "splittaa-guide-experience",
} as const;

function getStorage(kind: "local" | "session"): Storage | null {
  const storage =
    kind === "local" ? globalThis.localStorage : globalThis.sessionStorage;
  if (!storage || typeof storage.getItem !== "function") {
    return null;
  }
  return storage;
}

function isGuideUseCaseTag(value: string): value is GuideUseCaseTag {
  return (GUIDE_USE_CASE_TAGS as string[]).includes(value);
}

function parseUseCases(raw: string | null): GuideUseCaseTag[] | undefined {
  if (!raw) {
    return undefined;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return undefined;
    }
    const tags = parsed.filter(
      (item): item is GuideUseCaseTag =>
        typeof item === "string" && isGuideUseCaseTag(item)
    );
    return tags.length > 0 ? tags : undefined;
  } catch {
    return undefined;
  }
}

export function isGuideCompleted(): boolean {
  return getStorage("local")?.getItem(GUIDE_STORAGE_KEYS.completed) === "1";
}

export function markGuideCompleted(): void {
  getStorage("local")?.setItem(GUIDE_STORAGE_KEYS.completed, "1");
  getStorage("local")?.removeItem(GUIDE_STORAGE_KEYS.step);
  clearGuideChoices();
}

export function getSavedGuideStepId(): GuideStepId | null {
  const value = getStorage("local")?.getItem(GUIDE_STORAGE_KEYS.step);
  return value ? (value as GuideStepId) : null;
}

export function saveGuideStepId(stepId: GuideStepId): void {
  getStorage("local")?.setItem(GUIDE_STORAGE_KEYS.step, stepId);
}

export function clearSavedGuideStepId(): void {
  getStorage("local")?.removeItem(GUIDE_STORAGE_KEYS.step);
}

export function hasGuideAutoOpened(): boolean {
  return getStorage("local")?.getItem(GUIDE_STORAGE_KEYS.autoOpened) === "1";
}

export function markGuideAutoOpened(): void {
  getStorage("local")?.setItem(GUIDE_STORAGE_KEYS.autoOpened, "1");
}

export function getGuideChoices(): {
  useCases?: GuideUseCaseTag[];
  useCaseCustom?: string;
  experience?: GuideExperience;
} {
  const storage = getStorage("session");
  const useCases = parseUseCases(
    storage?.getItem(GUIDE_STORAGE_KEYS.useCases) ?? null
  );
  const customRaw = storage?.getItem(GUIDE_STORAGE_KEYS.useCaseCustom);
  const useCaseCustom = customRaw?.trim() ? customRaw.trim() : undefined;
  const experience = storage?.getItem(GUIDE_STORAGE_KEYS.experience) as
    | GuideExperience
    | null;
  return {
    useCases,
    useCaseCustom,
    experience: experience ?? undefined,
  };
}

export function saveGuideUseCases(useCases: GuideUseCaseTag[]): void {
  const storage = getStorage("session");
  if (!storage) {
    return;
  }
  if (useCases.length === 0) {
    storage.removeItem(GUIDE_STORAGE_KEYS.useCases);
    return;
  }
  storage.setItem(GUIDE_STORAGE_KEYS.useCases, JSON.stringify(useCases));
}

export function saveGuideUseCaseCustom(text: string): void {
  const storage = getStorage("session");
  if (!storage) {
    return;
  }
  const trimmed = text.trim();
  if (!trimmed) {
    storage.removeItem(GUIDE_STORAGE_KEYS.useCaseCustom);
    return;
  }
  storage.setItem(GUIDE_STORAGE_KEYS.useCaseCustom, trimmed);
}

export function saveGuideExperience(experience: GuideExperience): void {
  getStorage("session")?.setItem(GUIDE_STORAGE_KEYS.experience, experience);
}

export function clearGuideChoices(): void {
  const storage = getStorage("session");
  storage?.removeItem(GUIDE_STORAGE_KEYS.useCases);
  storage?.removeItem(GUIDE_STORAGE_KEYS.useCaseCustom);
  storage?.removeItem(GUIDE_STORAGE_KEYS.experience);
}
