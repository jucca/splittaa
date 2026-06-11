import { GUIDE_STEP_DEFINITIONS } from "./guide-steps";
import type {
  GuideChoices,
  GuideExperience,
  GuideStepDefinition,
  GuideUseCaseTag,
} from "./types";
import { GUIDE_USE_CASE_TAGS } from "./types";

function matchesAnyUseCase(
  stepUseCases: GuideUseCaseTag[] | undefined,
  selected: GuideUseCaseTag[]
): boolean {
  if (!stepUseCases || stepUseCases.length === 0) {
    return true;
  }
  return stepUseCases.some((tag) => selected.includes(tag));
}

function matchesExperience(
  stepMinExperience: GuideExperience | undefined,
  selected: GuideExperience
): boolean {
  if (!stepMinExperience) {
    return true;
  }
  return selected === stepMinExperience;
}

export function hasUseCaseSelection(choices: GuideChoices): boolean {
  const tagCount = choices.useCases?.length ?? 0;
  const hasCustom = (choices.useCaseCustom?.trim().length ?? 0) > 0;
  return tagCount > 0 || hasCustom;
}

/** Tags used for step filtering; custom-only falls back to all base tags. */
export function getEffectiveUseCaseTags(choices: GuideChoices): GuideUseCaseTag[] {
  const tags = choices.useCases ?? [];
  if (tags.length > 0) {
    return tags;
  }
  if ((choices.useCaseCustom?.trim().length ?? 0) > 0) {
    return [...GUIDE_USE_CASE_TAGS];
  }
  return [];
}

function filterInfoAndFinish(
  steps: GuideStepDefinition[],
  choices: GuideChoices & { experience: GuideExperience }
): GuideStepDefinition[] {
  if (choices.experience === "kokenut") {
    const finish = steps.find((step) => step.id === "finish");
    return finish ? [finish] : [];
  }

  const effectiveTags = getEffectiveUseCaseTags(choices);

  return steps.filter((step) => {
    if (step.type === "choice") {
      return false;
    }
    if (step.type === "finish") {
      return true;
    }
    return (
      matchesAnyUseCase(step.useCases, effectiveTags) &&
      matchesExperience(step.minExperience, choices.experience)
    );
  });
}

/**
 * Builds the visible step list for the guide overlay.
 * Before both choices are set, returns only the choice steps completed so far + next choice.
 */
export function resolveSteps(
  steps: GuideStepDefinition[] = GUIDE_STEP_DEFINITIONS,
  choices: GuideChoices
): GuideStepDefinition[] {
  const choiceSteps = steps.filter((step) => step.type === "choice");

  if (!hasUseCaseSelection(choices)) {
    return [choiceSteps[0]!];
  }

  if (!choices.experience) {
    return choiceSteps;
  }

  const infoAndFinish = filterInfoAndFinish(steps, {
    ...choices,
    experience: choices.experience,
  });

  return [...choiceSteps, ...infoAndFinish];
}

export function getProgressTotal(
  steps: GuideStepDefinition[],
  choices: GuideChoices
): number {
  if (!hasUseCaseSelection(choices) || !choices.experience) {
    return choiceStepsCount(steps);
  }
  return resolveSteps(steps, choices).length;
}

function choiceStepsCount(steps: GuideStepDefinition[]): number {
  return steps.filter((step) => step.type === "choice").length;
}
