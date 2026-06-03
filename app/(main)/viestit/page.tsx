"use client";

import Link from "next/link";
import { InboxFeed } from "@/components/features/inbox/inbox-feed";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Inbox } from "lucide-react";

export default function InboxPage() {
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
          <Inbox className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-4xl gradient-title">Viestit</h1>
          <p className="text-muted-foreground mt-1">
            Postilaatikko: ryhmäkutsut, saldomuistutukset ja muut ilmoitukset.
            Sähköpostit ja etusivun kutsulista toimivat kuten ennenkin.
          </p>
        </div>
      </div>

      <InboxFeed />
    </div>
  );
}
