import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

interface ProductFormSkeletonProps {
  sidebar?: boolean;
}

export function ProductFormSkeleton({ sidebar = false }: ProductFormSkeletonProps) {
  return (
    <section className="mx-auto max-w-6xl space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>

      <div
        className={
          sidebar ? "grid gap-4 lg:grid-cols-[minmax(0,1fr)_20rem]" : "space-y-4"
        }
      >
        <div className="space-y-4">
          <FormCardSkeleton rows={3} columns={3} />
          <FormCardSkeleton rows={4} columns={2} />
          <FormCardSkeleton rows={2} columns={3} />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-28" />
              <Skeleton className="h-4 w-56" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-36 w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>

        {sidebar ? (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-44" />
              </CardHeader>
              <CardContent className="space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between gap-3">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
                <Skeleton className="h-10 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function FormCardSkeleton({
  rows,
  columns,
}: {
  rows: number;
  columns: number;
}) {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-64 max-w-full" />
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: rows * columns }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
