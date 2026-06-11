import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export function JoinPageSkeleton() {
  return (
    <div className="container mx-auto py-12 flex justify-center" aria-busy="true">
      <Card className="w-full max-w-md">
        <CardContent className="py-8 space-y-4">
          <Skeleton className="h-6 w-48 mx-auto" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    </div>
  );
}
