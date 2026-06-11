"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type GuideChoiceCardProps = {
  label: string;
  description?: string;
  icon?: ReactNode;
  selected: boolean;
  onSelect: () => void;
  testId?: string;
};

export function GuideChoiceCard({
  label,
  description,
  icon,
  selected,
  onSelect,
  testId,
}: GuideChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={testId}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition",
        selected
          ? "border-green-600 bg-green-600/5"
          : "border-border hover:border-green-600/50"
      )}
    >
      {icon ? (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-lg">
          {icon}
        </span>
      ) : null}
      <span className="flex-1 min-w-0">
        <span className="block font-medium">{label}</span>
        {description ? (
          <span className="block text-sm text-muted-foreground">{description}</span>
        ) : null}
      </span>
      <span
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
          selected ? "border-green-600 bg-green-600 text-white" : "border-muted-foreground/30"
        )}
        aria-hidden
      >
        {selected ? <Check className="h-3.5 w-3.5" /> : null}
      </span>
    </button>
  );
}
