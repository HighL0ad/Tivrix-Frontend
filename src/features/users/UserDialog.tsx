import { useState, type ReactNode } from "react";
import {
  Banknote,
  Boxes,
  ChartNoAxesColumnIncreasing,
  CreditCard,
  Gauge,
  HandCoins,
  History,
  Pencil,
  ContactRound,
  ReceiptText,
  RotateCcw,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { useCurrentUser } from "@/entities/auth/api/use-current-user";
import type { UserRole } from "@/entities/auth/model/types";
import {
  type UserListItem,
  type UserPayload,
  useCreateUser,
  useUpdateUser,
} from "@/entities/users/api/use-users";
import { getApiErrorMessage } from "@/shared/api/error";
import { cn } from "@/shared/lib/utils";
import { AppSelect, ResponsiveModal } from "@/shared/ui/app-form";
import { Button } from "@/shared/ui/button";
import { FormError, FormField } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";

const resourceAccessFields = [
  { key: "can_access_dashboard", labelKey: "permissions.dashboard", icon: Gauge },
  { key: "can_access_products", labelKey: "permissions.products", icon: Boxes },
  { key: "can_access_finance", labelKey: "permissions.finance", icon: WalletCards },
  { key: "can_access_debts", labelKey: "permissions.debts", icon: HandCoins },
  { key: "can_access_clients", labelKey: "permissions.clients", icon: ContactRound },
  { key: "can_access_catalogs", labelKey: "permissions.catalogs", icon: Banknote },
] as const;

const financeViewFields = [
  { key: "can_view_finance_history", labelKey: "permissions.financeHistory", icon: History },
  { key: "can_view_finance_profit", labelKey: "permissions.financeProfit", icon: ChartNoAxesColumnIncreasing },
  { key: "can_view_finance_expenses", labelKey: "permissions.financeExpenses", icon: ReceiptText },
] as const;

const financeDetailFields = [
  { key: "can_transfer_wallets", labelKey: "permissions.transferWallets", icon: CreditCard },
  { key: "can_adjust_wallets", labelKey: "permissions.adjustWallets", icon: SlidersHorizontal },
  { key: "can_undo_transactions", labelKey: "permissions.undoTransactions", icon: RotateCcw },
] as const;

export function UserDialog({
  mode,
  user,
  disabled,
}: {
  mode: "create" | "edit";
  user?: UserListItem;
  disabled?: boolean;
}) {
  const { t } = useTranslation();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const currentUser = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [setupUrl, setSetupUrl] = useState<string | null>(null);
  const [username, setUsername] = useState(user?.username ?? "");
  const [role, setRole] = useState<UserRole>(user?.role ?? "user");
  const [isActive, setIsActive] = useState(user?.is_active ?? true);
  const [permissions, setPermissions] = useState({
    can_access_dashboard: user?.can_access_dashboard ?? true,
    can_access_products: user?.can_access_products ?? true,
    can_access_finance: user?.can_access_finance ?? true,
    can_access_debts: user?.can_access_debts ?? true,
    can_access_clients: user?.can_access_clients ?? true,
    can_access_catalogs: user?.can_access_catalogs ?? true,
  });
  const [operationPermissions, setOperationPermissions] = useState({
    can_view_finance_history: user?.can_view_finance_history ?? true,
    can_view_finance_profit: user?.can_view_finance_profit ?? true,
    can_view_finance_expenses: user?.can_view_finance_expenses ?? true,
    can_transfer_wallets: user?.can_transfer_wallets ?? false,
    can_adjust_wallets: user?.can_adjust_wallets ?? false,
    can_undo_transactions: user?.can_undo_transactions ?? false,
  });
  const [restrictionComment, setRestrictionComment] = useState(
    user?.restriction_comment ?? "",
  );
  const pending = createUser.isPending || updateUser.isPending;
  const formId = `user-${mode}-${user?.id ?? "new"}`;
  const canManageSuperAdmins = currentUser.data?.role === "super_admin";
  const roleOptions = [
    { id: "user", name: t("common.user") },
    ...(canManageSuperAdmins
      ? [{ id: "admin", name: t("common.admin") }]
      : []),
    ...(canManageSuperAdmins
      ? [{ id: "super_admin", name: t("common.superAdmin") }]
      : []),
  ];
  const canEditResourceAccess = role === "user";
  const displayName = username.trim() || (mode === "create" ? t("users.new") : user?.username ?? t("common.user"));
  const initials = getInitials(displayName);

  function buildPayload(): UserPayload {
    return {
      username: username.trim(),
      is_active: isActive,
      role,
      ...permissions,
      ...operationPermissions,
      restriction_comment: restrictionComment.trim() || null,
    };
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) {
          setSetupUrl(null);
        }
      }}
      title={
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-black uppercase text-primary">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              initials
            )}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-black text-foreground">
              {displayName}
            </span>
            <span className="block text-xs font-medium text-muted-foreground">
              {mode === "create" ? t("users.createTitle") : t("users.editTitle")}
            </span>
          </span>
        </div>
      }
      className="md:max-w-xl"
      trigger={
        mode === "create" ? (
          <Button type="button">{t("users.new")}</Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={disabled}
            aria-label={t("common.edit")}
          >
            <Pencil />
          </Button>
        )
      }
      footer={
        <div className="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setOpen(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button
            type="submit"
            form={formId}
            className="w-full sm:w-auto"
            disabled={
              !username.trim() ||
              (mode === "create" && Boolean(setupUrl)) ||
              pending
            }
          >
            {t("common.save")}
          </Button>
        </div>
      }
    >
        <form
          id={formId}
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (mode === "create") {
              createUser.mutate(
                buildPayload(),
                {
                  onSuccess: (createdUser) => {
                    setSetupUrl(createdUser.password_setup_url ?? null);
                    toast.success(t("users.created"));
                  },
                  onError: (error) => toast.error(getApiErrorMessage(error)),
                },
              );
            } else if (user) {
              updateUser.mutate(
                { userId: user.id, payload: buildPayload() },
                {
                  onSuccess: () => {
                    setOpen(false);
                    toast.success(t("users.updated"));
                  },
                  onError: (error) => toast.error(getApiErrorMessage(error)),
                },
              );
            }
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label={t("common.login")}>
              <Input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                minLength={3}
              />
            </FormField>
            <FormField label={t("common.role")}>
              <AppSelect
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
                options={roleOptions}
                disabled={role === "super_admin" && !canManageSuperAdmins}
              />
            </FormField>
            <FormField label={t("common.status")}>
              <button
                type="button"
                onClick={() => setIsActive((current) => !current)}
                className={cn(
                  "flex h-10 w-full items-center justify-between rounded-lg border px-3 text-sm font-medium transition-colors",
                  isActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-border bg-card text-muted-foreground",
                )}
              >
                <span>{t("common.active")}</span>
                <span
                  className={cn(
                    "flex h-5 w-9 items-center rounded-full p-0.5 transition-colors",
                    isActive ? "bg-primary" : "bg-muted-foreground/30",
                  )}
                >
                  <span
                    className={cn(
                      "size-4 rounded-full bg-white shadow-sm transition-transform",
                      isActive && "translate-x-4",
                    )}
                  />
                </span>
              </button>
            </FormField>
          </div>

          <PermissionSection
            title={
              canEditResourceAccess
                ? t("permissions.sections")
                : t("permissions.adminAllSections")
            }
          >
            <div className="flex flex-wrap gap-2">
              {resourceAccessFields.map(({ key, labelKey, icon: Icon }) => (
                <PermissionPill
                  key={key}
                  icon={<Icon />}
                  label={t(labelKey)}
                  selected={permissions[key]}
                  disabled={!canEditResourceAccess}
                  onToggle={() =>
                    setPermissions((current) => ({
                      ...current,
                      [key]: !current[key],
                    }))
                  }
                />
              ))}
            </div>
          </PermissionSection>

          <PermissionSection
            title={
              canEditResourceAccess ? t("permissions.insideFinance") : t("permissions.adminAllOperations")
            }
          >
            <div className="grid gap-2 sm:grid-cols-3">
              {financeViewFields.map(({ key, labelKey, icon: Icon }) => (
                <PermissionTile
                  key={key}
                  icon={<Icon />}
                  label={t(labelKey)}
                  selected={operationPermissions[key]}
                  disabled={!canEditResourceAccess}
                  onToggle={() =>
                    setOperationPermissions((current) => ({
                      ...current,
                      [key]: !current[key],
                    }))
                  }
                />
              ))}
            </div>
            <div className="border-t border-border pt-3">
              <div className="mb-2 text-[11px] font-black uppercase tracking-wide text-muted-foreground">
                {t("permissions.detailOperations")}
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {financeDetailFields.map(({ key, labelKey, icon: Icon }) => (
                  <PermissionTile
                    key={key}
                    icon={<Icon />}
                    label={t(labelKey)}
                    selected={operationPermissions[key]}
                    disabled={!canEditResourceAccess}
                    onToggle={() =>
                      setOperationPermissions((current) => ({
                        ...current,
                        [key]: !current[key],
                      }))
                    }
                  />
                ))}
              </div>
            </div>
          </PermissionSection>

          <FormField label={t("permissions.restrictedComment")}>
            <Input
              value={restrictionComment}
              onChange={(event) => setRestrictionComment(event.target.value)}
            />
          </FormField>

          {setupUrl ? (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
              <div className="font-bold">{t("users.createdWithSetupLink")}</div>
              <div className="mt-1 text-xs text-emerald-800">
                {t("users.setupLinkDescription")}
              </div>
              <div className="mt-2 break-all rounded-md border border-emerald-200 bg-white px-2 py-1.5 text-xs">
                {window.location.origin}
                {setupUrl}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-3 bg-white"
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}${setupUrl}`);
                  toast.info(t("common.copied"));
                }}
              >
                {t("users.copySetupLink")}
              </Button>
            </div>
          ) : null}

          {createUser.isError || updateUser.isError ? (
            <FormError
              message={getApiErrorMessage(
                mode === "create" ? createUser.error : updateUser.error,
              )}
            />
          ) : null}

        </form>
    </ResponsiveModal>
  );
}

function PermissionSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-lg border border-border bg-card">
      <div className="border-b border-border bg-muted/30 px-4 py-3 text-xs font-black uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <div className="space-y-3 p-3">{children}</div>
    </section>
  );
}

function PermissionPill({
  icon,
  label,
  selected,
  disabled,
  onToggle,
}: {
  icon: ReactNode;
  label: string;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "inline-flex min-h-9 items-center gap-2 rounded-full border px-3 text-sm font-semibold leading-tight transition-colors",
        selected
          ? "border-sky-300 bg-sky-50 text-sky-800 shadow-sm"
          : "border-border bg-muted/20 text-muted-foreground",
        disabled && "cursor-not-allowed opacity-60",
        "[&>svg]:size-4 [&>svg]:shrink-0",
      )}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function PermissionTile({
  icon,
  label,
  selected,
  disabled,
  onToggle,
}: {
  icon: ReactNode;
  label: string;
  selected: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onToggle}
      className={cn(
        "flex h-12 w-full items-center gap-2 rounded-lg border px-3 py-1 text-left text-sm font-semibold leading-tight transition-colors",
        selected
          ? "border-violet-300 bg-violet-50 text-violet-800 shadow-sm"
          : "border-border bg-muted/20 text-muted-foreground",
        disabled && "cursor-not-allowed opacity-60",
        "[&>svg]:size-4 [&>svg]:shrink-0",
      )}
    >
      {icon}
      <span className="min-w-0">{label}</span>
    </button>
  );
}

function getInitials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase() || "U";
}
