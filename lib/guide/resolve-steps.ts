import { GUIDE_STEP_DEFINITIONS } from "./guide-steps";
import type {
  GuideChoices,
  GuideExperience,
  GuideStepDefinition,
  GuideUseCase,
} from "./types";

function matchesUseCase(
  stepUseCases: GuideUseCase[] | undefined,
  selected: GuideUseCase
): boolean {
  if (!stepUseCases || stepUseCases.length === 0) {
    return true;
  }
  return stepUseCases.includes(selected);
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

function filterInfoAndFinish(
  steps: GuideStepDefinition[],
  choices: Required<GuideChoices>
): GuideStepDefinition[] {
  if (choices.experience === "kokenut") {
    const finish = steps.find((step) => step.id === "finish");
    return finish ? [finish] : [];
  }

  return steps.filter((step) => {
    if (step.type === "choice") {
      return false;
    }
    if (step.type === "finish") {
      return true;
    }
    return (
      matchesUseCase(step.useCases, choices.useCase) &&
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

  if (!choices.useCase) {
    return [choiceSteps[0]!];
  }

  if (!choices.experience) {
    return choiceSteps;
  }

  const infoAndFinish = filterInfoAndFinish(steps, {
    useCase: choices.useCase,
    experience: choices.experience,
  });

  return [...choiceSteps, ...infoAndFinish];
}

export function getProgressTotal(
  steps: GuideStepDefinition[],
  choices: GuideChoices
): number {
  if (!choices.useCase || !choices.experience) {
    return choiceStepsCount(steps);
  }
  return resolveSteps(steps, choices).length;
}

function choiceStepsCount(steps: GuideStepDefinition[]): number {
  return steps.filter((step) => step.type === "choice").length;
}
