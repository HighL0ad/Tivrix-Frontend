import { Skeleton } from "@/shared/ui/skeleton";
import { i18n } from "@/shared/i18n";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { TivrixMark } from "@/shared/ui/tivrix-mark";

export function ProductsPageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      <Card>
        <CardHeader className="gap-4">
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-20 rounded-lg" />
          </div>
          <Skeleton className="h-10 w-full" />
          <div className="grid gap-2 sm:grid-cols-2">
            <Skeleton className="h-10 w-full rounded-lg" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 7 }).map((_, index) => (
            <div key={index} className="flex h-14 w-full items-center justify-between border-b px-2 gap-4">
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function FinancePageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-60" />
        </div>
        <Skeleton className="h-10 w-32 rounded-lg" />
      </div>

      <Card className="border-violet-200/50 bg-violet-600/10 p-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-44" />
          <Skeleton className="h-10 w-56" />
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="flex items-start justify-between gap-3 p-4">
              <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="size-9 rounded-lg" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 border-b pb-3">
            <Skeleton className="h-8 w-20 rounded-md" />
            <Skeleton className="h-8 w-24 rounded-md" />
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function DebtsPageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>
      </div>

      <div className="flex gap-2 border-b pb-3">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-2 p-4">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-32" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-10 w-full sm:w-72" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="space-y-2 text-right">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function ClientsPageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-36 rounded-lg" />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="size-8 rounded-lg" />
              </div>
              <Skeleton className="h-7 w-20" />
              <Skeleton className="h-3 w-36" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-10 w-full sm:w-72" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between rounded-lg border p-3.5">
              <div className="flex items-center gap-3">
                <Skeleton className="size-10 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function UsersPageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-8 w-36" />
        <Skeleton className="h-4 w-52" />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-10 w-44 rounded-lg" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between rounded-lg border p-3.5">
              <div className="flex items-center gap-3">
                <Skeleton className="size-9 rounded-full" />
                <div className="space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-16 rounded-full" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function CatalogsPageSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="flex gap-2 border-b pb-3">
        <Skeleton className="h-9 w-28 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-36 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <Skeleton className="h-10 flex-1 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-10 w-full sm:w-72" />
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="flex items-center justify-between rounded-lg border p-3.5">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

export function DetailPageSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-9 w-28 rounded-lg" />
      <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
        <Card>
          <CardHeader className="space-y-3">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <div className="grid gap-3 sm:grid-cols-2">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-14 w-full rounded-lg" />
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function PageLoading() {
  return <ProductsPageSkeleton />;
}

export function AppShellLoading() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside className="fixed z-40 hidden h-full w-64 flex-col border-r border-white/10 bg-[#0f172a] text-white md:flex">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="h-6 w-28 rounded-md bg-white/12" />
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 p-3">
          <div className="mb-2 h-10 rounded-lg border border-white/10 bg-white/5" />

          {Array.from({ length: 7 }).map((_, index) => (
            <div
              key={index}
              className="flex h-10 items-center gap-3 rounded-lg px-3"
            >
              <div className="size-5 rounded-md bg-white/10" />
              <div
                className="h-3 rounded-full bg-white/10"
                style={{ width: `${index % 3 === 0 ? 5.5 : index % 3 === 1 ? 6.5 : 7.5}rem` }}
              />
            </div>
          ))}

          <div className="mt-3 border-t border-white/10 pt-3">
            <div className="h-10 rounded-lg bg-sky-600/70" />
          </div>

          <div className="mt-auto overflow-hidden rounded-lg border border-white/10 bg-white/[0.04]">
            <div className="flex items-center gap-2 px-3 py-2.5">
              <div className="size-10 rounded-full bg-white/10" />
              <div className="min-w-0 space-y-2">
                <div className="h-3 w-20 rounded-full bg-white/14" />
                <div className="h-2.5 w-16 rounded-full bg-white/10" />
              </div>
            </div>
            <div className="border-t border-white/10" />
            <div className="h-10 bg-white/[0.02]" />
            <div className="border-t border-white/10" />
            <div className="h-10 bg-white/[0.02]" />
          </div>
        </nav>
      </aside>

      <main className="w-full md:pl-64">
        <div className="mx-auto max-w-md p-4 pb-24 md:max-w-7xl md:p-6 md:pb-8 lg:p-8">
          <div className="mb-4 flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 shadow-sm md:hidden">
            <div className="h-6 w-24 rounded-md bg-muted" />
            <div className="flex items-center gap-2">
              <div className="size-10 rounded-full bg-muted" />
              <div className="size-10 rounded-full bg-muted" />
            </div>
          </div>

          <PageLoading />
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 z-40 w-full border-t border-white/10 bg-[#0f172a] shadow-2xl md:hidden">
        <div className="mx-auto grid h-16 max-w-md grid-cols-5 place-items-center">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className={index === 2 ? "size-14 rounded-xl bg-sky-600/70" : "size-8 rounded-lg bg-white/10"}
            />
          ))}
        </div>
      </nav>
    </div>
  );
}

export function InitialAuthLoading() {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#0b1120] text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-3">
          <TivrixMark className="size-12 shrink-0 drop-shadow-md" />
          <h1 className="text-2xl font-black tracking-tight text-white">
            Tivrix
          </h1>
        </div>
        <div className="flex items-center gap-1.5 pt-2">
          <div className="size-2 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.3s]" />
          <div className="size-2 animate-bounce rounded-full bg-sky-400 [animation-delay:-0.15s]" />
          <div className="size-2 animate-bounce rounded-full bg-sky-400" />
        </div>
      </div>
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
