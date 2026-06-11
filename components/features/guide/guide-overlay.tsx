"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ChevronLeft,
  Globe,
  Home,
  LayoutDashboard,
  Plane,
  Receipt,
  Scale,
  Sparkles,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GuideChoiceCard } from "./guide-choice-card";
import { GuideProgress } from "./guide-progress";
import { GUIDE_STEP_DEFINITIONS } from "@/lib/guide/guide-steps";
import {
  clearSavedGuideStepId,
  getGuideChoices,
  getSavedGuideStepId,
  markGuideCompleted,
  saveGuideExperience,
  saveGuideStepId,
  saveGuideUseCaseCustom,
  saveGuideUseCases,
} from "@/lib/guide/guide-storage";
import { getProgressTotal, resolveSteps } from "@/lib/guide/resolve-steps";
import type {
  GuideExperience,
  GuideStepDefinition,
  GuideStepId,
  GuideUseCaseTag,
} from "@/lib/guide/types";
import {
  GUIDE_EXPERIENCES,
  GUIDE_USE_CASE_CUSTOM_MAX_LENGTH,
  GUIDE_USE_CASE_TAGS,
} from "@/lib/guide/types";

const USE_CASE_ICONS: Record<GuideUseCaseTag, LucideIcon> = {
  kotikulut: Home,
  matka: Plane,
  satunnaiset: Wallet,
};

const EXPERIENCE_ICONS: Record<GuideExperience, LucideIcon> = {
  uusi: Sparkles,
  perusteet: Scale,
  kokenut: Receipt,
};

const INFO_ICONS: Partial<Record<GuideStepId, LucideIcon>> = {
  "balance-basics": Scale,
  dashboard: LayoutDashboard,
  "new-expense": Receipt,
  groups: Users,
  "personal-debt": Wallet,
  "multi-currency": Globe,
  finish: Sparkles,
};

type GuideOverlayProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function findStepIndex(steps: GuideStepDefinition[], stepId: GuideStepId): number {
  const index = steps.findIndex((step) => step.id === stepId);
  return index >= 0 ? index : 0;
}

function arraysEqual(a: GuideUseCaseTag[], b: GuideUseCaseTag[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((tag, index) => tag === sortedB[index]);
}

export function GuideOverlay({ open, onOpenChange }: GuideOverlayProps) {
  const t = useTranslations("guide");
  const [choices, setChoices] = useState(getGuideChoices);
  const [stepIndex, setStepIndex] = useState(0);
  const [pendingUseCases, setPendingUseCases] = useState<GuideUseCaseTag[]>([]);
  const [pendingCustom, setPendingCustom] = useState("");
  const [pendingExperience, setPendingExperience] = useState<
    GuideExperience | undefined
  >();

  const resolvedSteps = useMemo(
    () => resolveSteps(GUIDE_STEP_DEFINITIONS, choices),
    [choices]
  );

  const currentStep = resolvedSteps[stepIndex];
  const progressTotal = getProgressTotal(GUIDE_STEP_DEFINITIONS, choices);
  const progressCurrent = stepIndex + 1;

  const allTagsSelected = useMemo(
    () => arraysEqual(pendingUseCases, [...GUIDE_USE_CASE_TAGS]),
    [pendingUseCases]
  );

  const resetFromStorage = useCallback(() => {
    const storedChoices = getGuideChoices();
    const storedSteps = resolveSteps(GUIDE_STEP_DEFINITIONS, storedChoices);
    const savedStepId = getSavedGuideStepId();
    const initialIndex = savedStepId
      ? findStepIndex(storedSteps, savedStepId)
      : 0;

    setChoices(storedChoices);
    setStepIndex(initialIndex);
    setPendingUseCases(storedChoices.useCases ?? []);
    setPendingCustom(storedChoices.useCaseCustom ?? "");
    setPendingExperience(storedChoices.experience);
  }, []);

  const handleDismiss = useCallback(() => {
    if (currentStep) {
      saveGuideStepId(currentStep.id);
    }
    onOpenChange(false);
  }, [currentStep, onOpenChange]);

  useEffect(() => {
    if (open) {
      resetFromStorage();
    }
  }, [open, resetFromStorage]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleDismiss();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleDismiss]);

  useEffect(() => {
    if (!currentStep) {
      return;
    }
    if (currentStep.type === "choice" && currentStep.choiceKey === "useCase") {
      setPendingUseCases(choices.useCases ?? []);
      setPendingCustom(choices.useCaseCustom ?? "");
    } else if (
      currentStep.type === "choice" &&
      currentStep.choiceKey === "experience"
    ) {
      setPendingExperience(choices.experience);
    }
  }, [
    currentStep,
    choices.useCases,
    choices.useCaseCustom,
    choices.experience,
  ]);

  const handleSkip = useCallback(() => {
    markGuideCompleted();
    onOpenChange(false);
  }, [onOpenChange]);

  const handleFinish = useCallback(() => {
    markGuideCompleted();
    clearSavedGuideStepId();
    onOpenChange(false);
  }, [onOpenChange]);

  const handleBack = useCallback(() => {
    if (stepIndex === 0) {
      handleDismiss();
      return;
    }
    setStepIndex((index) => Math.max(0, index - 1));
  }, [handleDismiss, stepIndex]);

  const toggleUseCaseTag = useCallback((tag: GuideUseCaseTag) => {
    setPendingUseCases((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag]
    );
  }, []);

  const toggleAllUseCases = useCallback(() => {
    setPendingUseCases((current) =>
      arraysEqual(current, [...GUIDE_USE_CASE_TAGS])
        ? []
        : [...GUIDE_USE_CASE_TAGS]
    );
  }, []);

  const handleContinue = useCallback(() => {
    if (!currentStep) {
      return;
    }

    if (currentStep.type === "choice" && currentStep.choiceKey === "useCase") {
      const trimmedCustom = pendingCustom.trim();
      if (pendingUseCases.length === 0 && !trimmedCustom) {
        return;
      }
      saveGuideUseCases(pendingUseCases);
      saveGuideUseCaseCustom(trimmedCustom);
      const nextChoices = {
        ...choices,
        useCases: pendingUseCases.length > 0 ? pendingUseCases : undefined,
        useCaseCustom: trimmedCustom || undefined,
      };
      setChoices(nextChoices);
      setStepIndex(1);
      setPendingExperience(nextChoices.experience);
      return;
    }

    if (currentStep.type === "choice" && currentStep.choiceKey === "experience") {
      if (!pendingExperience) {
        return;
      }
      const experience = pendingExperience;
      saveGuideExperience(experience);
      const nextChoices = { ...choices, experience };
      setChoices(nextChoices);
      const nextSteps = resolveSteps(GUIDE_STEP_DEFINITIONS, nextChoices);
      if (experience === "kokenut") {
        setStepIndex(nextSteps.length - 1);
      } else {
        setStepIndex(2);
      }
      return;
    }

    if (stepIndex < resolvedSteps.length - 1) {
      setStepIndex((index) => index + 1);
    }
  }, [
    choices,
    currentStep,
    pendingCustom,
    pendingExperience,
    pendingUseCases,
    resolvedSteps.length,
    stepIndex,
  ]);

  const canContinue = useMemo(() => {
    if (!currentStep) {
      return false;
    }
    if (currentStep.type === "choice" && currentStep.choiceKey === "useCase") {
      return (
        pendingUseCases.length > 0 || pendingCustom.trim().length > 0
      );
    }
    if (currentStep.type === "choice" && currentStep.choiceKey === "experience") {
      return Boolean(pendingExperience);
    }
    return true;
  }, [currentStep, pendingCustom, pendingExperience, pendingUseCases]);

  if (!open || !currentStep) {
    return null;
  }

  const stepKey = currentStep.id.replace(/-/g, "_");

  return createPortal(
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guide-step-title"
    >
      <div className="mx-auto flex h-full min-h-0 w-full max-w-lg flex-col px-4 pb-6 pt-4">
        <div className="mb-6 flex items-center gap-3">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleBack}
            aria-label={t("back")}
            data-testid="guide-back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <GuideProgress current={progressCurrent} total={progressTotal} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleDismiss}
            aria-label={t("close")}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto">
          <div className="space-y-2">
            <h2 id="guide-step-title" className="text-2xl font-bold leading-tight">
              {t(`steps.${stepKey}.title`)}
            </h2>
            {t.has(`steps.${stepKey}.subtitle`) ? (
              <p className="text-muted-foreground">{t(`steps.${stepKey}.subtitle`)}</p>
            ) : null}
          </div>

          {currentStep.type === "choice" && currentStep.choiceKey === "useCase" ? (
            <div className="flex flex-col gap-3">
              {GUIDE_USE_CASE_TAGS.map((option) => {
                const Icon = USE_CASE_ICONS[option];
                return (
                  <GuideChoiceCard
                    key={option}
                    label={t(`steps.${stepKey}.options.${option}.label`)}
                    description={t(`steps.${stepKey}.options.${option}.description`)}
                    icon={<Icon className="h-5 w-5 text-green-600" />}
                    selected={pendingUseCases.includes(option)}
                    onSelect={() => toggleUseCaseTag(option)}
                    testId={`guide-choice-${option}`}
                    multiSelect
                  />
                );
              })}
              <GuideChoiceCard
                label={t(`steps.${stepKey}.options.kaikki.label`)}
                description={t(`steps.${stepKey}.options.kaikki.description`)}
                icon={<Sparkles className="h-5 w-5 text-green-600" />}
                selected={allTagsSelected}
                onSelect={toggleAllUseCases}
                testId="guide-choice-kaikki"
                multiSelect
              />
              <div className="space-y-2 pt-1">
                <label
                  htmlFor="guide-use-case-custom-input"
                  className="text-sm font-medium"
                >
                  {t("steps.use_case.custom_label")}
                </label>
                <textarea
                  id="guide-use-case-custom-input"
                  data-testid="guide-use-case-custom-input"
                  value={pendingCustom}
                  onChange={(event) =>
                    setPendingCustom(
                      event.target.value.slice(0, GUIDE_USE_CASE_CUSTOM_MAX_LENGTH)
                    )
                  }
                  placeholder={t("steps.use_case.custom_placeholder")}
                  rows={2}
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-600"
                />
                {t.has("steps.use_case.custom_hint") ? (
                  <p className="text-xs text-muted-foreground">
                    {t("steps.use_case.custom_hint")}
                  </p>
                ) : null}
              </div>
            </div>
          ) : currentStep.type === "choice" ? (
            <div className="flex flex-col gap-3">
              {GUIDE_EXPERIENCES.map((option) => {
                const Icon = EXPERIENCE_ICONS[option];
                return (
                  <GuideChoiceCard
                    key={option}
                    label={t(`steps.${stepKey}.options.${option}.label`)}
                    description={t(`steps.${stepKey}.options.${option}.description`)}
                    icon={<Icon className="h-5 w-5 text-green-600" />}
                    selected={pendingExperience === option}
                    onSelect={() => setPendingExperience(option)}
                    testId={`guide-choice-${option}`}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4 rounded-xl border bg-muted/30 px-6 py-8 text-center">
              {INFO_ICONS[currentStep.id] ? (
                (() => {
                  const Icon = INFO_ICONS[currentStep.id]!;
                  return (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-600/10">
                      <Icon className="h-8 w-8 text-green-600" />
                    </div>
                  );
                })()
              ) : null}
              <p className="text-base leading-relaxed text-muted-foreground">
                {t(`steps.${stepKey}.body`)}
              </p>
            </div>
          )}
        </div>

        <div className="mt-6 space-y-3">
          {currentStep.type === "finish" ? (
            <Button
              asChild
              className="h-12 w-full bg-green-600 text-base hover:bg-green-700"
            >
              <Link href="/expenses/new" data-testid="guide-finish-cta" onClick={handleFinish}>
                {t("finishCta")}
              </Link>
            </Button>
          ) : (
            <Button
              type="button"
              className="h-12 w-full bg-green-600 text-base hover:bg-green-700"
              disabled={!canContinue}
              onClick={handleContinue}
              data-testid="guide-continue"
            >
              {t("continue")}
            </Button>
          )}
          <button
            type="button"
            className="w-full text-sm text-muted-foreground underline-offset-4 hover:underline"
            onClick={handleSkip}
            data-testid="guide-skip"
          >
            {t("skip")}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
