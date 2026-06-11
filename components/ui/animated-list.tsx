"use client";

import type { ReactNode } from "react";
import { AnimatePresence, m } from "motion/react";
import { cn } from "@/lib/utils";

type ListElement = "div" | "ul";

type AnimatedListProps = {
  children: ReactNode;
  className?: string;
  as?: ListElement;
  "aria-label"?: string;
  "data-testid"?: string;
};

export function AnimatedList({
  children,
  className,
  as: Tag = "div",
  "aria-label": ariaLabel,
  "data-testid": dataTestId,
}: AnimatedListProps) {
  return (
    <Tag
      className={className}
      aria-label={ariaLabel}
      data-testid={dataTestId}
      role={Tag === "div" ? "list" : undefined}
    >
      <AnimatePresence initial={false}>{children}</AnimatePresence>
    </Tag>
  );
}

type AnimatedListItemProps = {
  id: string;
  children: ReactNode;
  className?: string;
  as?: "div" | "li";
};

export function AnimatedListItem({
  id,
  children,
  className,
  as: ItemTag = "div",
}: AnimatedListItemProps) {
  const MotionItem = ItemTag === "li" ? m.li : m.div;

  return (
    <MotionItem
      key={id}
      layout={false}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(className)}
      role={ItemTag === "div" ? "listitem" : undefined}
    >
      {children}
    </MotionItem>
  );
}
