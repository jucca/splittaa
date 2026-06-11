import { describe, expect, it } from "vitest";
import {
  getEffectiveUseCaseTags,
  hasUseCaseSelection,
  resolveSteps,
} from "@/lib/guide/resolve-steps";
import { GUIDE_STEP_DEFINITIONS } from "@/lib/guide/guide-steps";
import type { GuideExperience, GuideUseCaseTag } from "@/lib/guide/types";
import { GUIDE_USE_CASE_TAGS } from "@/lib/guide/types";

const EXPERIENCES: GuideExperience[] = ["uusi", "perusteet", "kokenut"];

function stepIds(
  useCases: GuideUseCaseTag[] | undefined,
  experience: GuideExperience,
  useCaseCustom?: string
): string[] {
  return resolveSteps(GUIDE_STEP_DEFINITIONS, {
    useCases,
    useCaseCustom,
    experience,
  }).map((step) => step.id);
}

function allTagsStepIds(experience: GuideExperience): string[] {
  return stepIds([...GUIDE_USE_CASE_TAGS], experience);
}

describe("hasUseCaseSelection", () => {
  it("is false when no tags and no custom text", () => {
    expect(hasUseCaseSelection({})).toBe(false);
    expect(hasUseCaseSelection({ useCases: [] })).toBe(false);
    expect(hasUseCaseSelection({ useCaseCustom: "   " })).toBe(false);
  });

  it("is true with tags or custom text", () => {
    expect(hasUseCaseSelection({ useCases: ["matka"] })).toBe(true);
    expect(hasUseCaseSelection({ useCaseCustom: "harrastusporukka" })).toBe(
      true
    );
  });
});

describe("getEffectiveUseCaseTags", () => {
  it("returns selected tags when present", () => {
    expect(getEffectiveUseCaseTags({ useCases: ["kotikulut", "matka"] })).toEqual(
      ["kotikulut", "matka"]
    );
  });

  it("falls back to all tags for custom-only", () => {
    expect(
      getEffectiveUseCaseTags({ useCaseCustom: "työmatkat" })
    ).toEqual([...GUIDE_USE_CASE_TAGS]);
  });
});

describe("resolveSteps", () => {
  it("returns only use-case step before use case is chosen", () => {
    expect(resolveSteps(GUIDE_STEP_DEFINITIONS, {}).map((s) => s.id)).toEqual([
      "use-case",
    ]);
  });

  it("returns both choice steps before experience is chosen", () => {
    expect(
      resolveSteps(GUIDE_STEP_DEFINITIONS, { useCases: ["matka"] }).map(
        (s) => s.id
      )
    ).toEqual(["use-case", "experience"]);
  });

  it("returns both choice steps for custom-only before experience", () => {
    expect(
      resolveSteps(GUIDE_STEP_DEFINITIONS, {
        useCaseCustom: "porukka",
      }).map((s) => s.id)
    ).toEqual(["use-case", "experience"]);
  });

  it("kokenut skips info steps and goes to finish", () => {
    const tagSets: GuideUseCaseTag[][] = [
      ["kotikulut"],
      ["matka"],
      ["satunnaiset"],
      [...GUIDE_USE_CASE_TAGS],
    ];
    for (const tags of tagSets) {
      expect(stepIds(tags, "kokenut")).toEqual([
        "use-case",
        "experience",
        "finish",
      ]);
    }
    expect(stepIds(undefined, "kokenut", "vain teksti")).toEqual([
      "use-case",
      "experience",
      "finish",
    ]);
  });

  it("uusi + kotikulut includes balance basics, dashboard, expense, groups", () => {
    expect(stepIds(["kotikulut"], "uusi")).toEqual([
      "use-case",
      "experience",
      "balance-basics",
      "dashboard",
      "new-expense",
      "groups",
      "finish",
    ]);
  });

  it("perusteet + kotikulut skips balance basics", () => {
    expect(stepIds(["kotikulut"], "perusteet")).toEqual([
      "use-case",
      "experience",
      "dashboard",
      "new-expense",
      "groups",
      "finish",
    ]);
  });

  it("satunnaiset excludes groups and multi-currency", () => {
    expect(stepIds(["satunnaiset"], "uusi")).toEqual([
      "use-case",
      "experience",
      "balance-basics",
      "dashboard",
      "new-expense",
      "personal-debt",
      "finish",
    ]);
  });

  it("matka includes groups and multi-currency but not personal-debt", () => {
    expect(stepIds(["matka"], "uusi")).toEqual([
      "use-case",
      "experience",
      "balance-basics",
      "dashboard",
      "new-expense",
      "groups",
      "multi-currency",
      "finish",
    ]);
  });

  it("all tags includes all info steps for uusi", () => {
    expect(allTagsStepIds("uusi")).toEqual([
      "use-case",
      "experience",
      "balance-basics",
      "dashboard",
      "new-expense",
      "groups",
      "personal-debt",
      "multi-currency",
      "finish",
    ]);
  });

  it("custom-only matches all-tags path for uusi", () => {
    expect(stepIds(undefined, "uusi", "oma idea")).toEqual(allTagsStepIds("uusi"));
  });

  it("union: kotikulut + matka shows groups and multi-currency, not personal-debt", () => {
    expect(stepIds(["kotikulut", "matka"], "uusi")).toEqual([
      "use-case",
      "experience",
      "balance-basics",
      "dashboard",
      "new-expense",
      "groups",
      "multi-currency",
      "finish",
    ]);
  });

  it("union: matka + satunnaiset shows groups, personal-debt, multi-currency", () => {
    expect(stepIds(["matka", "satunnaiset"], "uusi")).toEqual([
      "use-case",
      "experience",
      "balance-basics",
      "dashboard",
      "new-expense",
      "groups",
      "personal-debt",
      "multi-currency",
      "finish",
    ]);
  });

  it("covers single-tag × experience combinations with stable finish step", () => {
    for (const tag of GUIDE_USE_CASE_TAGS) {
      for (const experience of EXPERIENCES) {
        const ids = stepIds([tag], experience);
        expect(ids[0]).toBe("use-case");
        expect(ids[1]).toBe("experience");
        expect(ids.at(-1)).toBe("finish");
        expect(ids.length).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
