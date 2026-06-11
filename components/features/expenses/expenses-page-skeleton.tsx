import { Skeleton } from "@/components/ui/skeleton";
import { ExpenseListSkeleton } from "@/components/features/expenses/expense-list-skeleton";

export function ExpensesPageSkeleton() {
  return (
    <div className="container mx-auto py-6 max-w-4xl space-y-6" aria-busy="true">
      <Skeleton className="h-9 w-28" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-full max-w-md" />
      </div>
      <ExpenseListSkeleton rows={5} />
    </div>
  );
}
