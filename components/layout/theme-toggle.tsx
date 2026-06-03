"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <div
      className="flex items-center gap-2"
      data-testid="theme-toggle"
    >
      <Sun
        className="h-4 w-4 text-muted-foreground"
        aria-hidden
      />
      <Switch
        id="theme-toggle"
        checked={isDark}
        disabled={!mounted}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-label="Tummatila"
        data-testid="dark-mode-toggle"
      />
      <Moon
        className="h-4 w-4 text-muted-foreground"
        aria-hidden
      />
      <Label htmlFor="theme-toggle" className="sr-only">
        Tummatila
      </Label>
    </div>
  );
}
