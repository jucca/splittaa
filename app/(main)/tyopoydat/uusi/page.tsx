"use client";

import { CreateWorkspaceForm } from "@/components/features/workspaces/create-workspace-form";
import { useTranslations } from "next-intl";

export default function NewWorkspacePage() {
  const t = useTranslations("workspaces");

  return (
    <div className="space-y-6 py-6">
      <div>
        <h1 className="text-5xl gradient-title">{t("createTitle")}</h1>
        <p className="text-muted-foreground mt-1">{t("createSubtitle")}</p>
      </div>
      <CreateWorkspaceForm />
    </div>
  );
}
