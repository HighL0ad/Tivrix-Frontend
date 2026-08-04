import { Crown, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import type { UserListItem } from "@/entities/users/api/use-users";
import {
  useCreatePasswordSetupLink,
  useUsers,
} from "@/entities/users/api/use-users";
import { DeleteUserButton } from "@/features/users/DeleteUserButton";
import { UserDialog } from "@/features/users/UserDialog";
import { getApiErrorMessage } from "@/shared/api/error";
import { shortDate } from "@/shared/lib/format";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/card";
import { PageHeader } from "@/shared/ui/page-header";
import { PageError, PageLoading } from "@/shared/ui/page-state";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/shared/ui/table";

const roleLabelKey: Record<string, string> = {
  super_admin: "common.superAdmin",
  admin: "common.admin",
  user: "common.user",
};

const roleBadgeClassName: Record<string, string> = {
  super_admin: "border-amber-200 bg-amber-50 text-amber-800",
  admin: "border-sky-200 bg-sky-50 text-sky-800",
  user: "border-border bg-background text-muted-foreground",
};

const RoleIcon = {
  super_admin: Crown,
  admin: ShieldCheck,
  user: UserRound,
};

export function UsersPage() {
  const { t } = useTranslation();
  const usersQuery = useUsers();
  const passwordSetupLink = useCreatePasswordSetupLink();

  if (usersQuery.isLoading) {
    return <PageLoading />;
  }

  if (!usersQuery.data) {
    return <PageError />;
  }

  const currentUser = usersQuery.data.items.find(
    (user) => user.id === usersQuery.data.current_user_id,
  );

  return (
    <section className="space-y-5">
      <PageHeader title={t("users.title")} description={t("users.description")} />

      <Card>
        <CardHeader className="grid grid-cols-[1fr_auto] items-center">
          <CardTitle>{t("users.list")}</CardTitle>
          <UserDialog mode="create" />
        </CardHeader>
        <CardContent>
          <Table className="hidden md:table">
            <TableHeader>
              <TableRow>
                <TableHead>{t("common.login")}</TableHead>
                <TableHead>{t("common.role")}</TableHead>
                <TableHead>{t("common.status")}</TableHead>
                <TableHead>{t("users.lastLogin")}</TableHead>
                <TableHead>{t("permissions.accesses")}</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {usersQuery.data.items.map((user) => {
                const Icon = RoleIcon[user.role] ?? UserRound;
                const canManageUser = currentUser
                  ? canManageTargetUser(currentUser, user)
                  : false;

                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-black uppercase text-primary">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              alt=""
                              className="size-full object-cover"
                            />
                          ) : (
                            getInitials(user.username)
                          )}
                        </span>
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground">{user.username}</span>
                          <span className="text-[11px] text-muted-foreground">
                            {t("users.createdAt")}: {shortDate(user.created_at)}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={roleBadgeClassName[user.role]}
                      >
                        <Icon />
                        {roleLabelKey[user.role] ? t(roleLabelKey[user.role]) : user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {!user.is_active ? (
                        <Badge variant="outline" className="border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                          {t("common.disabled")}
                        </Badge>
                      ) : user.pending_activation ? (
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300">
                          {t("users.pendingActivation")}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400">
                          {t("common.active")}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-muted-foreground">
                      {user.last_login_at ? shortDate(user.last_login_at) : "—"}
                    </TableCell>
                    <TableCell>
                      {user.role === "super_admin" ? t("permissions.withAdminManagement") : user.is_admin ? t("common.all") : [
                        user.can_access_dashboard && t("permissions.dashboard"),
                        user.can_access_products && t("permissions.products"),
                        user.can_access_finance && t("permissions.finance"),
                        user.can_access_debts && t("permissions.debts"),
                        user.can_access_clients && t("permissions.clients"),
                        user.can_access_catalogs && t("permissions.catalogs"),
                      ].filter(Boolean).join(", ")}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <UserDialog
                          mode="edit"
                          user={user}
                          disabled={!canManageUser}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon-sm"
                          disabled={!canManageUser || passwordSetupLink.isPending}
                          aria-label={t("users.resetPassword")}
                          title={t("users.resetPassword")}
                          onClick={() =>
                            passwordSetupLink.mutate(user.id, {
                              onSuccess: (data) => {
                                navigator.clipboard.writeText(
                                  `${window.location.origin}${data.password_setup_url}`,
                                );
                                toast.info(t("users.resetPasswordCopied"));
                              },
                              onError: (error) =>
                                toast.error(getApiErrorMessage(error)),
                            })
                          }
                        >
                          <KeyRound />
                        </Button>
                        <DeleteUserButton
                          userId={user.id}
                          username={user.username}
                          disabled={
                            user.id === usersQuery.data.current_user_id ||
                            !canManageUser
                          }
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Mobile User Card List */}
          <div className="grid gap-3 md:hidden">
            {usersQuery.data.items.map((user) => {
              const Icon = RoleIcon[user.role] ?? UserRound;
              const canManageUser = currentUser
                ? canManageTargetUser(currentUser, user)
                : false;

              return (
                <div key={user.id} className="rounded-xl border border-border bg-card p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-black uppercase text-primary">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt=""
                            className="size-full object-cover"
                          />
                        ) : (
                          getInitials(user.username)
                        )}
                      </span>
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground text-sm">{user.username}</span>
                        <span className="text-[11px] text-muted-foreground">
                          {t("users.createdAt")}: {shortDate(user.created_at)}
                        </span>
                      </div>
                    </div>
                    <div>
                      {!user.is_active ? (
                        <Badge variant="outline" className="border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
                          {t("common.disabled")}
                        </Badge>
                      ) : user.pending_activation ? (
                        <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300">
                          {t("users.pendingActivation")}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/15 dark:text-emerald-400">
                          {t("common.active")}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-y border-border/50 py-2.5 text-xs">
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                        {t("common.role")}
                      </span>
                      <Badge variant="outline" className={cn("h-5 py-0", roleBadgeClassName[user.role])}>
                        <Icon className="size-3" />
                        <span>{roleLabelKey[user.role] ? t(roleLabelKey[user.role]) : user.role}</span>
                      </Badge>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                        {t("users.lastLogin")}
                      </span>
                      <span className="font-medium text-foreground">
                        {user.last_login_at ? shortDate(user.last_login_at) : "—"}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-0.5">
                      {t("permissions.accesses")}
                    </span>
                    <span className="text-muted-foreground font-medium">
                      {user.role === "super_admin" ? t("permissions.withAdminManagement") : user.is_admin ? t("common.all") : [
                        user.can_access_dashboard && t("permissions.dashboard"),
                        user.can_access_products && t("permissions.products"),
                        user.can_access_finance && t("permissions.finance"),
                        user.can_access_debts && t("permissions.debts"),
                        user.can_access_clients && t("permissions.clients"),
                        user.can_access_catalogs && t("permissions.catalogs"),
                      ].filter(Boolean).join(", ")}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 border-t border-border/50 pt-3">
                    <UserDialog
                      mode="edit"
                      user={user}
                      disabled={!canManageUser}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon-sm"
                      disabled={!canManageUser || passwordSetupLink.isPending}
                      aria-label={t("users.resetPassword")}
                      title={t("users.resetPassword")}
                      onClick={() =>
                        passwordSetupLink.mutate(user.id, {
                          onSuccess: (data) => {
                            navigator.clipboard.writeText(
                              `${window.location.origin}${data.password_setup_url}`,
                            );
                            toast.info(t("users.resetPasswordCopied"));
                          },
                          onError: (error) =>
                            toast.error(getApiErrorMessage(error)),
                        })
                      }
                    >
                      <KeyRound />
                    </Button>
                    <DeleteUserButton
                      userId={user.id}
                      username={user.username}
                      disabled={
                        user.id === usersQuery.data.current_user_id ||
                        !canManageUser
                      }
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function getInitials(value: string) {
  return value.trim().slice(0, 2).toUpperCase() || "U";
}

function canManageTargetUser(currentUser: UserListItem, targetUser: UserListItem) {
  if (currentUser.role === "super_admin") {
    return true;
  }

  return !targetUser.is_admin;
}
