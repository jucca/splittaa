export type GuideUseCaseTag = "kotikulut" | "matka" | "satunnaiset";

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
  useCases?: GuideUseCaseTag[];
  /** Shown only when experience equals this value */
  minExperience?: GuideExperience;
};

export type GuideChoices = {
  useCases?: GuideUseCaseTag[];
  useCaseCustom?: string;
  experience?: GuideExperience;
};

export const GUIDE_USE_CASE_TAGS: GuideUseCaseTag[] = [
  "kotikulut",
  "matka",
  "satunnaiset",
];

export const GUIDE_EXPERIENCES: GuideExperience[] = [
  "uusi",
  "perusteet",
  "kokenut",
];

export const GUIDE_USE_CASE_CUSTOM_MAX_LENGTH = 120;
