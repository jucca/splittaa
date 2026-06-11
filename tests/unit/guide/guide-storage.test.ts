import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  GUIDE_STORAGE_KEYS,
  clearGuideChoices,
  getGuideChoices,
  hasGuideAutoOpened,
  isGuideCompleted,
  markGuideAutoOpened,
  markGuideCompleted,
  saveGuideExperience,
  saveGuideStepId,
  saveGuideUseCaseCustom,
  saveGuideUseCases,
} from "@/lib/guide/guide-storage";

describe("guide-storage", () => {
  const localStore = new Map<string, string>();
  const sessionStore = new Map<string, string>();

  beforeEach(() => {
    localStore.clear();
    sessionStore.clear();
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => localStore.get(key) ?? null,
      setItem: (key: string, value: string) => {
        localStore.set(key, value);
      },
      removeItem: (key: string) => {
        localStore.delete(key);
      },
    });
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => sessionStore.get(key) ?? null,
      setItem: (key: string, value: string) => {
        sessionStore.set(key, value);
      },
      removeItem: (key: string) => {
        sessionStore.delete(key);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("tracks completion and auto-open flags", () => {
    expect(isGuideCompleted()).toBe(false);
    expect(hasGuideAutoOpened()).toBe(false);

    markGuideAutoOpened();
    expect(hasGuideAutoOpened()).toBe(true);

    markGuideCompleted();
    expect(isGuideCompleted()).toBe(true);
    expect(localStore.has(GUIDE_STORAGE_KEYS.step)).toBe(false);
  });

  it("persists step id and session choices", () => {
    saveGuideStepId("dashboard");
    expect(localStore.get(GUIDE_STORAGE_KEYS.step)).toBe("dashboard");

    saveGuideUseCases(["matka", "kotikulut"]);
    saveGuideUseCaseCustom("harrastusporukka");
    saveGuideExperience("uusi");
    expect(getGuideChoices()).toEqual({
      useCases: ["matka", "kotikulut"],
      useCaseCustom: "harrastusporukka",
      experience: "uusi",
    });

    markGuideCompleted();
    expect(getGuideChoices()).toEqual({});
  });

  it("clearGuideChoices removes session keys", () => {
    saveGuideUseCases(["satunnaiset"]);
    saveGuideUseCaseCustom("oma");
    clearGuideChoices();
    expect(sessionStore.has(GUIDE_STORAGE_KEYS.useCases)).toBe(false);
    expect(sessionStore.has(GUIDE_STORAGE_KEYS.useCaseCustom)).toBe(false);
  });

  it("ignores invalid use case JSON", () => {
    sessionStore.set(GUIDE_STORAGE_KEYS.useCases, '["invalid"]');
    expect(getGuideChoices().useCases).toBeUndefined();
  });
});
