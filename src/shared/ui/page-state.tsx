import { Skeleton } from "@/shared/ui/skeleton";

export function PageLoading() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export function PageError({ message = "Не удалось загрузить данные" }: { message?: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
      {message}
    </div>
  );
}
