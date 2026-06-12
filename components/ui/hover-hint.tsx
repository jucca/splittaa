"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type HoverHintProps = {
  label: string;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  /** When true, wrapper stretches to fill flex/grid parents (e.g. full-width Select). */
  fullWidth?: boolean;
};

/** Shows explanatory text when the pointer rests on compact controls (icons, selects). */
export function HoverHint({
  label,
  children,
  side = "top",
  fullWidth = false,
}: HoverHintProps) {
  // Span isolates Tooltip ref from Radix triggers (SelectTrigger, Button) to avoid compose-refs loops.
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex min-w-0",
            fullWidth ? "w-full" : "shrink-0"
          )}
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}
