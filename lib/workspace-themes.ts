import { Plane, PiggyBank, Home, LayoutGrid, type LucideIcon } from "lucide-react";

export type WorkspaceThemeId = "matka" | "saastaminen" | "koti" | "yleinen";

export type WorkspaceTheme = {
  id: WorkspaceThemeId;
  icon: LucideIcon;
  accentClass: string;
  borderClass: string;
  gradientClass: string;
};

export const WORKSPACE_THEMES: WorkspaceTheme[] = [
  {
    id: "matka",
    icon: Plane,
    accentClass: "text-orange-600 dark:text-orange-400",
    borderClass: "border-orange-200 dark:border-orange-900",
    gradientClass: "from-orange-500/10 to-amber-500/5",
  },
  {
    id: "saastaminen",
    icon: PiggyBank,
    accentClass: "text-emerald-600 dark:text-emerald-400",
    borderClass: "border-emerald-200 dark:border-emerald-900",
    gradientClass: "from-emerald-500/10 to-green-500/5",
  },
  {
    id: "koti",
    icon: Home,
    accentClass: "text-blue-600 dark:text-blue-400",
    borderClass: "border-blue-200 dark:border-blue-900",
    gradientClass: "from-blue-500/10 to-sky-500/5",
  },
  {
    id: "yleinen",
    icon: LayoutGrid,
    accentClass: "text-primary",
    borderClass: "border-border",
    gradientClass: "from-primary/10 to-primary/5",
  },
];

export function getWorkspaceTheme(themeId: string): WorkspaceTheme {
  return (
    WORKSPACE_THEMES.find((t) => t.id === themeId) ??
    WORKSPACE_THEMES.find((t) => t.id === "yleinen")!
  );
}

export function isWorkspaceThemeId(value: string): value is WorkspaceThemeId {
  return WORKSPACE_THEMES.some((t) => t.id === value);
}
