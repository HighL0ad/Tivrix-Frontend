import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

export function ProductDetailSkeleton() {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between animate-pulse">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44 sm:w-56" />
          <Skeleton className="h-4 w-64 max-w-full sm:w-80" />
        </div>
        <Skeleton className="h-10 w-24 rounded-lg" />
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-2/3" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-48 w-full rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
