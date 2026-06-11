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
  // Span isolates Tooltip ref from Radix triggers (SelectTrigger, Button) to avoid compose-refs loops.
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex w-full min-w-0">{children}</span>
      </TooltipTrigger>
      <TooltipContent side={side}>{label}</TooltipContent>
    </Tooltip>
  );
}
