import type { GuideExperience, GuideStepId, GuideUseCase } from "./types";

export const GUIDE_STORAGE_KEYS = {
  completed: "splittaa-guide-completed",
  step: "splittaa-guide-step",
  autoOpened: "splittaa-guide-auto-opened",
  useCase: "splittaa-guide-use-case",
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
  useCase?: GuideUseCase;
  experience?: GuideExperience;
} {
  const storage = getStorage("session");
  const useCase = storage?.getItem(GUIDE_STORAGE_KEYS.useCase) as
    | GuideUseCase
    | null;
  const experience = storage?.getItem(GUIDE_STORAGE_KEYS.experience) as
    | GuideExperience
    | null;
  return {
    useCase: useCase ?? undefined,
    experience: experience ?? undefined,
  };
}

export function saveGuideUseCase(useCase: GuideUseCase): void {
  getStorage("session")?.setItem(GUIDE_STORAGE_KEYS.useCase, useCase);
}

export function saveGuideExperience(experience: GuideExperience): void {
  getStorage("session")?.setItem(GUIDE_STORAGE_KEYS.experience, experience);
}

export function clearGuideChoices(): void {
  const storage = getStorage("session");
  storage?.removeItem(GUIDE_STORAGE_KEYS.useCase);
  storage?.removeItem(GUIDE_STORAGE_KEYS.experience);
}
