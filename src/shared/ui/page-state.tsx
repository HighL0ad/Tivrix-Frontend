import { Skeleton } from "@/shared/ui/skeleton";
import { i18n } from "@/shared/i18n";

export function PageLoading() {
  return (
    <div className="mx-auto flex min-h-[45vh] w-full max-w-md flex-col justify-center space-y-3 px-4">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-4 w-64 max-w-full" />
      <Skeleton className="h-24 w-full rounded-lg" />
    </div>
  );
}

export function PageError({ message = i18n.t("common.noData") }: { message?: string }) {
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
      {message}
    </div>
  );
}
