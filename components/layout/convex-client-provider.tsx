"use client";

import { ConvexReactClient } from "convex/react";
import { useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { ReactNode } from "react";
import { requireConvexUrl } from "@/lib/config/env";
import { LocaleSync } from "@/components/layout/locale-sync";

const convex = new ConvexReactClient(requireConvexUrl());

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      <LocaleSync />
      {children}
    </ConvexProviderWithClerk>
  );
}
