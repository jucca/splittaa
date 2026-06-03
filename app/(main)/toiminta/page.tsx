"use client";

import Link from "next/link";
import { ActivityFeed } from "@/components/features/activity/activity-feed";
import { Button } from "@/components/ui/button";
import { ArrowLeft, History } from "lucide-react";

export default function ActivityPage() {
  return (
    <div className="container mx-auto py-6 max-w-2xl space-y-6">
      <div className="flex items-start gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Takaisin
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-3 rounded-md">
          <History className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl gradient-title">Toiminta</h1>
          <p className="text-muted-foreground mt-1">
            Viimeisimmät kulut ja tilitykset — uusin ylimpänä. Näet missä
            kontekstissa, kenen kanssa ja summan.
          </p>
        </div>
      </div>

      <ActivityFeed />
    </div>
  );
}
