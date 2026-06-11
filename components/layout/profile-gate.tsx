"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { Skeleton } from "@/components/ui/skeleton";

const ALLOWED_PREFIXES = ["/profiili/luo", "/join/"];

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: me, isLoading } = useConvexQuery(api.users.me);

  const allowed = ALLOWED_PREFIXES.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (isLoading || !me || me.profileCompleted || allowed) return;
    const query = searchParams.toString();
    const next = encodeURIComponent(
      query ? `${pathname}?${query}` : pathname
    );
    router.replace(`/profiili/luo?next=${next}`);
  }, [isLoading, me, allowed, pathname, router, searchParams]);

  if (!allowed && (isLoading || (me && !me.profileCompleted))) {
    return (
      <div className="flex justify-center py-24" aria-busy="true">
        <Skeleton className="h-8 w-40" />
      </div>
    );
  }

  return <>{children}</>;
}
