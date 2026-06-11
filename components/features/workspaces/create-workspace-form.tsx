"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useConvexMutation } from "@/hooks/use-convex-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  WORKSPACE_THEMES,
  type WorkspaceThemeId,
} from "@/lib/workspace-themes";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLocale, useTranslations } from "next-intl";
import { getConvexErrorFromUnknown } from "@/lib/i18n/convex-errors";
import { resolveLocale } from "@/lib/i18n/locales";

type GoalDraft = {
  id: string;
  type: "budget_cap" | "savings_target";
  label: string;
  targetAmount: string;
};

function newGoalDraft(): GoalDraft {
  return {
    id: crypto.randomUUID(),
    type: "budget_cap",
    label: "",
    targetAmount: "",
  };
}

export function CreateWorkspaceForm() {
  const t = useTranslations("workspaces");
  const tShared = useTranslations("shared");
  const locale = resolveLocale(useLocale());
  const router = useRouter();
  const createWorkspace = useConvexMutation(api.workspaces.create);

  const [name, setName] = useState("");
  const [themeId, setThemeId] = useState<WorkspaceThemeId>("yleinen");
  const [goals, setGoals] = useState<GoalDraft[]>([newGoalDraft()]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsedGoals = goals
      .map((g) => ({
        type: g.type,
        label: g.label.trim(),
        targetAmount: parseFloat(g.targetAmount),
      }))
      .filter((g) => g.label && !isNaN(g.targetAmount) && g.targetAmount > 0);

    if (parsedGoals.length === 0) {
      toast.error(t("validationGoalRequired"));
      return;
    }

    try {
      const workspaceId = await createWorkspace.mutate({
        name: name.trim(),
        themeId,
        goals: parsedGoals,
      });
      toast.success(t("toastCreated"));
      router.push(`/tyopoyta/${workspaceId}`);
    } catch (error) {
      toast.error(getConvexErrorFromUnknown(error, locale));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="workspace-name">{t("nameLabel")}</Label>
        <Input
          id="workspace-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t("namePlaceholder")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label>{t("themeLabel")}</Label>
        <div className="grid grid-cols-2 gap-3">
          {WORKSPACE_THEMES.map((theme) => {
            const Icon = theme.icon;
            const selected = themeId === theme.id;
            return (
              <button
                key={theme.id}
                type="button"
                onClick={() => setThemeId(theme.id)}
                className={cn(
                  "rounded-lg border p-4 text-left transition-colors bg-gradient-to-br",
                  theme.gradientClass,
                  selected ? theme.borderClass : "border-border opacity-80"
                )}
              >
                <Icon className={cn("h-5 w-5 mb-2", theme.accentClass)} />
                <p className="font-medium text-sm">
                  {t(`themes.${theme.id}`)}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>{t("goalsLabel")}</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setGoals((prev) => [...prev, newGoalDraft()])}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t("addGoal")}
          </Button>
        </div>

        {goals.map((goal, index) => (
          <Card key={goal.id}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex gap-2 items-start">
                <div className="flex-1 space-y-3">
                  <div className="space-y-1">
                    <Label>{t("goalNameLabel")}</Label>
                    <Input
                      value={goal.label}
                      onChange={(e) =>
                        setGoals((prev) =>
                          prev.map((g) =>
                            g.id === goal.id
                              ? { ...g, label: e.target.value }
                              : g
                          )
                        )
                      }
                      placeholder={t("goalNamePlaceholder")}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label>{t("goalTypeLabel")}</Label>
                      <Select
                        value={goal.type}
                        onValueChange={(value) => {
                          if (
                            value !== "budget_cap" &&
                            value !== "savings_target"
                          ) {
                            return;
                          }
                          setGoals((prev) =>
                            prev.map((g) =>
                              g.id === goal.id ? { ...g, type: value } : g
                            )
                          );
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="budget_cap">
                            {t("goalTypeBudget")}
                          </SelectItem>
                          <SelectItem value="savings_target">
                            {t("goalTypeSavings")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label>{t("goalAmountLabel")}</Label>
                      <Input
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={goal.targetAmount}
                        onChange={(e) =>
                          setGoals((prev) =>
                            prev.map((g) =>
                              g.id === goal.id
                                ? { ...g, targetAmount: e.target.value }
                                : g
                            )
                          )
                        }
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
                {goals.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 mt-6"
                    onClick={() =>
                      setGoals((prev) => prev.filter((g) => g.id !== goal.id))
                    }
                    aria-label={t("removeGoal")}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {index === 0 && (
                <p className="text-xs text-muted-foreground">{t("goalsHint")}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Button type="submit" disabled={createWorkspace.isLoading || !name.trim()}>
        {createWorkspace.isLoading ? tShared("creating") : t("createWorkspace")}
      </Button>
    </form>
  );
}
