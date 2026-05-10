import { ShieldAlert } from "lucide-react";
import type { ReactNode } from "react";
import { Navigate, NavLink } from "react-router";

import { useCurrentUser } from "@/entities/auth/api/use-current-user";
import type { AppResourceKey } from "@/entities/auth/model/types";
import { Button } from "@/shared/ui/button";
import { Card, CardContent } from "@/shared/ui/card";
import { PageLoading } from "@/shared/ui/page-state";

export function AccessGuard({
  resource,
  adminOnly,
  children,
}: {
  resource?: AppResourceKey;
  adminOnly?: boolean;
  children: ReactNode;
}) {
  const currentUserQuery = useCurrentUser();
  const currentUser = currentUserQuery.data;

  if (currentUserQuery.isLoading) {
    return <PageLoading />;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const allowed = adminOnly
    ? currentUser.is_admin
    : resource
      ? currentUser.permissions[resource]
      : true;

  if (!allowed) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center">
        <Card className="w-full max-w-lg border-amber-200 bg-amber-50/40">
          <CardContent className="flex flex-col items-center px-6 py-10 text-center">
            <span className="flex size-12 items-center justify-center rounded-full bg-amber-100 text-amber-700">
              <ShieldAlert className="size-6" />
            </span>
            <h1 className="mt-4 text-xl font-black text-foreground">
              Доступ ограничен
            </h1>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              {currentUser.restriction_comment ||
                "У вас нет доступа к этому разделу"}
            </p>
            <Button asChild className="mt-6">
              <NavLink to="/">На главную</NavLink>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  return children;
}
