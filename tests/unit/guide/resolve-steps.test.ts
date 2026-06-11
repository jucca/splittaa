import { describe, expect, it } from "vitest";
import { resolveSteps } from "@/lib/guide/resolve-steps";
import { GUIDE_STEP_DEFINITIONS } from "@/lib/guide/guide-steps";
import type { GuideExperience, GuideUseCase } from "@/lib/guide/types";

const USE_CASES: GuideUseCase[] = ["kotikulut", "matka", "satunnaiset", "kaikki"];
const EXPERIENCES: GuideExperience[] = ["uusi", "perusteet", "kokenut"];

function stepIds(useCase: GuideUseCase, experience: GuideExperience): string[] {
  return resolveSteps(GUIDE_STEP_DEFINITIONS, { useCase, experience }).map(
    (step) => step.id
  );
}

describe("resolveSteps", () => {
  it("returns only use-case step before useCase is chosen", () => {
    expect(resolveSteps(GUIDE_STEP_DEFINITIONS, {}).map((s) => s.id)).toEqual([
      "use-case",
    ]);
  });

  it("returns both choice steps before experience is chosen", () => {
    expect(
      resolveSteps(GUIDE_STEP_DEFINITIONS, { useCase: "kaikki" }).map((s) => s.id)
    ).toEqual(["use-case", "experience"]);
  });

  it("kokenut skips info steps and goes to finish", () => {
    for (const useCase of USE_CASES) {
      expect(stepIds(useCase, "kokenut")).toEqual([
        "use-case",
        "experience",
        "finish",
      ]);
    }
  });

  it("uusi + kotikulut includes balance basics, dashboard, expense, groups", () => {
    expect(stepIds("kotikulut", "uusi")).toEqual([
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
    expect(stepIds("kotikulut", "perusteet")).toEqual([
      "use-case",
      "experience",
      "dashboard",
      "new-expense",
      "groups",
      "finish",
    ]);
  });

  it("satunnaiset excludes groups and multi-currency", () => {
    expect(stepIds("satunnaiset", "uusi")).toEqual([
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
    expect(stepIds("matka", "uusi")).toEqual([
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

  it("kaikki includes all info steps for uusi", () => {
    expect(stepIds("kaikki", "uusi")).toEqual([
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

  it("covers all 12 useCase × experience combinations with stable finish step", () => {
    for (const useCase of USE_CASES) {
      for (const experience of EXPERIENCES) {
        const ids = stepIds(useCase, experience);
        expect(ids[0]).toBe("use-case");
        expect(ids[1]).toBe("experience");
        expect(ids.at(-1)).toBe("finish");
        expect(ids.length).toBeGreaterThanOrEqual(3);
      }
    }
  });
});
