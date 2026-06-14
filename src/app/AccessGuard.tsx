import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, NavLink } from "react-router";

import { useCurrentUser } from "@/entities/auth/api/use-current-user";
import type { AppResourceKey } from "@/entities/auth/model/types";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { PageLoading } from "@/shared/ui/page-state";

const resourceLabelKeys: Partial<Record<AppResourceKey, string>> = {
  dashboard: "app.nav.dashboard",
  products: "app.nav.products",
  finance: "app.nav.finance",
  debts: "app.nav.debts",
  clients: "app.nav.clients",
  catalogs: "app.nav.catalogs",
};

export function AccessGuard({
  resource,
  adminOnly,
  superAdminOnly,
  children,
}: {
  resource?: AppResourceKey;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const currentUserQuery = useCurrentUser();
  const currentUser = currentUserQuery.data;

  if (currentUserQuery.isLoading) {
    return <PageLoading />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const allowed = superAdminOnly
    ? currentUser.role === "super_admin"
    : adminOnly
      ? currentUser.is_admin
      : resource
        ? currentUser.permissions[resource]
        : true;

  if (!allowed) {
    const fallbackRoute = currentUser.first_accessible_route ?? "/";
    const resourceLabel =
      (resource ? t(resourceLabelKeys[resource] ?? "") : null) ||
      (currentUser.resources.find((item) => item.key === resource)?.label ??
        t("common.noAccessSection"));

    return (
      <section className="relative h-[calc(100vh-8rem)] min-h-[420px] overflow-hidden rounded-lg md:h-[calc(100vh-4rem)]">
        <div className="pointer-events-none select-none space-y-4 blur-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-48 rounded-lg bg-muted" />
              <div className="mt-2 h-4 w-72 rounded bg-muted/70" />
            </div>
            <div className="h-10 w-32 rounded-lg bg-muted" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 rounded-lg border bg-card" />
            ))}
          </div>
          <div className="h-48 rounded-lg border bg-card md:h-72" />
          <div className="grid gap-3 md:grid-cols-2">
            <div className="h-32 rounded-lg border bg-card md:h-48" />
            <div className="h-32 rounded-lg border bg-card md:h-48" />
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center bg-background/55 p-4 backdrop-blur-sm">
        <Card className="w-full max-w-lg border-amber-200 bg-amber-50/95 shadow-xl">
          <CardContent className="flex flex-col items-center px-6 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <ShieldAlert className="size-6" />
            </span>
            <h1 className="mt-4 text-xl font-black text-foreground">
              {t("common.accessDenied")}
            </h1>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {currentUser.restriction_comment ||
                t("common.accessDeniedDescription", { resource: resourceLabel })}
            </p>
            <Button asChild className="mt-6">
              <NavLink to={fallbackRoute}>{t("common.goToAvailableSection")}</NavLink>
            </Button>
          </CardContent>
        </Card>
        </div>
      </section>
    );
  }

  return children;
}
