"use client";

import Link from "next/link";
import { InboxFeed } from "@/components/features/inbox/inbox-feed";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Inbox } from "lucide-react";
import { useTranslations } from "next-intl";

export default function InboxPage() {
  const t = useTranslations("inbox");
  const tShared = useTranslations("shared");

  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tShared("back")}
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-md">
          <Inbox className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl gradient-title">{t("pageTitle")}</h1>
          <p className="text-muted-foreground mt-1">{t("pageSubtitle")}</p>
        </div>
      </div>

      <InboxFeed />
    </div>
  );
}
