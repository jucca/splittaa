"use client";

import type { ReactNode } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type HoverHintProps = {
  label: string;
  children: ReactNode;
  side?: "top" | "right" | "bottom" | "left";
};

/** Shows explanatory text when the pointer rests on compact controls (icons, selects). */
export function HoverHint({ label, children, side = "top" }: HoverHintProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild title={label}>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}
