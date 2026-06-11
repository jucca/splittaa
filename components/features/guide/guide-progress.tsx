"use client";

import { cn } from "@/lib/utils";

type GuideProgressProps = {
  current: number;
  total: number;
  className?: string;
};

export function GuideProgress({ current, total, className }: GuideProgressProps) {
  const safeTotal = Math.max(total, 1);
  const safeCurrent = Math.min(Math.max(current, 0), safeTotal);

  return (
    <div
      className={cn("flex w-full gap-1", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={safeTotal}
      aria-valuenow={safeCurrent}
      data-testid="guide-progress"
    >
      {Array.from({ length: safeTotal }, (_, index) => (
        <div
          key={index}
          className={cn(
            "h-2 flex-1 rounded-full transition-colors duration-300",
            index < safeCurrent ? "bg-green-600" : "bg-muted"
          )}
        />
      ))}
    </div>
  );
}
