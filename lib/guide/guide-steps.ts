import type { GuideStepDefinition } from "./types";

/** Canonical step definitions — visibility resolved by resolveSteps */
export const GUIDE_STEP_DEFINITIONS: GuideStepDefinition[] = [
  { id: "use-case", type: "choice", choiceKey: "useCase" },
  { id: "experience", type: "choice", choiceKey: "experience" },
  {
    id: "balance-basics",
    type: "info",
    minExperience: "uusi",
  },
  { id: "dashboard", type: "info" },
  { id: "new-expense", type: "info" },
  {
    id: "groups",
    type: "info",
    useCases: ["kotikulut", "matka", "kaikki"],
  },
  {
    id: "personal-debt",
    type: "info",
    useCases: ["satunnaiset", "kaikki"],
  },
  {
    id: "multi-currency",
    type: "info",
    useCases: ["matka", "kaikki"],
  },
  { id: "finish", type: "finish" },
];
