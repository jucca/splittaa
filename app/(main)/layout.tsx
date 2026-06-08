"use client";

import { Authenticated } from "convex/react";
import React, { Suspense } from "react";
import { ProfileGate } from "@/components/layout/profile-gate";

const MainLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <Authenticated>
      <Suspense
        fallback={
          <div className="container mx-auto mt-24 mb-20 px-4">{children}</div>
        }
      >
        <ProfileGate>
          <div className="container mx-auto mt-24 mb-20 px-4">{children}</div>
        </ProfileGate>
      </Suspense>
    </Authenticated>
  );
};

export default MainLayout;
