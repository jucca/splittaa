export type GuideUseCase = "kotikulut" | "matka" | "satunnaiset" | "kaikki";

export type GuideExperience = "uusi" | "perusteet" | "kokenut";

export type GuideStepId =
  | "use-case"
  | "experience"
  | "balance-basics"
  | "dashboard"
  | "new-expense"
  | "groups"
  | "personal-debt"
  | "multi-currency"
  | "finish";

export type GuideStepType = "choice" | "info" | "finish";

export type GuideChoiceKey = "useCase" | "experience";

export type GuideStepDefinition = {
  id: GuideStepId;
  type: GuideStepType;
  choiceKey?: GuideChoiceKey;
  useCases?: GuideUseCase[];
  /** Shown only when experience equals this value */
  minExperience?: GuideExperience;
};

export type GuideChoices = {
  useCase?: GuideUseCase;
  experience?: GuideExperience;
};

export const GUIDE_USE_CASES: GuideUseCase[] = [
  "kotikulut",
  "matka",
  "satunnaiset",
  "kaikki",
];

export const GUIDE_EXPERIENCES: GuideExperience[] = [
  "uusi",
  "perusteet",
  "kokenut",
];
