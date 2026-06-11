"use client";

import { Authenticated } from "convex/react";
import React, { Suspense } from "react";
import { ProfileGate } from "@/components/layout/profile-gate";
import { WorkspaceSidebar } from "@/components/features/workspaces/workspace-sidebar";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Authenticated>
      <Suspense
        fallback={
          <div className="container mx-auto mt-24 mb-20 px-4">{children}</div>
        }
      >
        <ProfileGate>
          <div className="container mx-auto mt-24 mb-20 px-4">
            <div className="flex gap-8">
              <WorkspaceSidebar />
              <div className="flex-1 min-w-0">{children}</div>
            </div>
          </div>
        </ProfileGate>
      </Suspense>
    </Authenticated>
  );
};

export default MainLayout;
