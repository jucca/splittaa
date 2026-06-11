"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { HelpCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { HoverHint } from "@/components/ui/hover-hint";
import { GuideOverlay } from "./guide-overlay";
import {
  hasGuideAutoOpened,
  isGuideCompleted,
  markGuideAutoOpened,
} from "@/lib/guide/guide-storage";

export function GuideAssistant() {
  const t = useTranslations("guide");
  const pathname = usePathname();
  const me = useQuery(api.users.me);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (pathname !== "/dashboard") {
      return;
    }
    if (!me?.profileCompleted) {
      return;
    }
    if (isGuideCompleted() || hasGuideAutoOpened()) {
      return;
    }

    markGuideAutoOpened();
    setOpen(true);
  }, [me?.profileCompleted, pathname]);

  return (
    <>
      <HoverHint label={t("openHint")} side="bottom">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          aria-label={t("openAria")}
          data-testid="guide-trigger"
          onClick={() => setOpen(true)}
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </HoverHint>
      <GuideOverlay open={open} onOpenChange={setOpen} />
    </>
  );
}
