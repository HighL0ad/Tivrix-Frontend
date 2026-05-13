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
  ReceiptText,
  RotateCcw,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";
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
  { key: "can_access_dashboard", label: "Главная", icon: Gauge },
  { key: "can_access_products", label: "Товары", icon: Boxes },
  { key: "can_access_finance", label: "Касса", icon: WalletCards },
  { key: "can_access_debts", label: "Долги", icon: HandCoins },
  { key: "can_access_catalogs", label: "Справочники", icon: Banknote },
] as const;

const financeViewFields = [
  { key: "can_view_finance_history", label: "История", icon: History },
  { key: "can_view_finance_profit", label: "Прибыль", icon: ChartNoAxesColumnIncreasing },
  { key: "can_view_finance_expenses", label: "Расходы", icon: ReceiptText },
] as const;

const financeDetailFields = [
  { key: "can_transfer_wallets", label: "Переводы", icon: CreditCard },
  { key: "can_adjust_wallets", label: "Корректировка", icon: SlidersHorizontal },
  { key: "can_undo_transactions", label: "Отмена операций", icon: RotateCcw },
] as const;

export function UserDialog({
  mode,
  user,
}: {
  mode: "create" | "edit";
  user?: UserListItem;
}) {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const currentUser = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState(user?.username ?? "");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>(user?.role ?? "user");
  const [isActive, setIsActive] = useState(user?.is_active ?? true);
  const [permissions, setPermissions] = useState({
    can_access_dashboard: user?.can_access_dashboard ?? true,
    can_access_products: user?.can_access_products ?? true,
    can_access_finance: user?.can_access_finance ?? true,
    can_access_debts: user?.can_access_debts ?? true,
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
    { id: "user", name: "Пользователь" },
    { id: "admin", name: "Администратор" },
    ...(canManageSuperAdmins || role === "super_admin"
      ? [{ id: "super_admin", name: "Супер администратор" }]
      : []),
  ];
  const canEditResourceAccess = role === "user";
  const displayName = username.trim() || (mode === "create" ? "Новый пользователь" : user?.username ?? "Пользователь");
  const initials = getInitials(displayName);

  function buildPayload(): UserPayload {
    return {
      username: username.trim(),
      ...(password ? { password } : {}),
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
      onOpenChange={setOpen}
      title={
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-black uppercase text-primary">
            {initials}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-base font-black text-foreground">
              {displayName}
            </span>
            <span className="block text-xs font-medium text-muted-foreground">
              {mode === "create" ? "Создание пользователя" : "Редактирование пользователя"}
            </span>
          </span>
        </div>
      }
      className="md:max-w-xl"
      trigger={
        mode === "create" ? (
          <Button type="button">Новый пользователь</Button>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Редактировать"
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
            Отмена
          </Button>
          <Button
            type="submit"
            form={formId}
            className="w-full sm:w-auto"
            disabled={
              !username.trim() ||
              (mode === "create" && password.length < 4) ||
              pending
            }
          >
            Сохранить
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
                { ...buildPayload(), password },
                {
                  onSuccess: () => {
                    setOpen(false);
                    toast.success("Пользователь создан");
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
                    toast.success("Пользователь обновлён");
                  },
                  onError: (error) => toast.error(getApiErrorMessage(error)),
                },
              );
            }
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <FormField label="Логин">
              <Input
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                required
                minLength={3}
              />
            </FormField>
            <FormField label={mode === "create" ? "Пароль" : "Новый пароль"}>
              <Input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                required={mode === "create"}
                minLength={mode === "create" ? 4 : undefined}
              />
            </FormField>
            <FormField label="Роль">
              <AppSelect
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
                options={roleOptions}
                disabled={role === "super_admin" && !canManageSuperAdmins}
              />
            </FormField>
            <FormField label="Статус">
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
                <span>Активен</span>
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
                ? "Доступные разделы"
                : "Админам доступны все разделы"
            }
          >
            <div className="flex flex-wrap gap-2">
              {resourceAccessFields.map(({ key, label, icon: Icon }) => (
                <PermissionPill
                  key={key}
                  icon={<Icon />}
                  label={label}
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
              canEditResourceAccess ? "Права внутри кассы" : "Админам доступны все операции"
            }
          >
            <div className="grid gap-2 sm:grid-cols-3">
              {financeViewFields.map(({ key, label, icon: Icon }) => (
                <PermissionTile
                  key={key}
                  icon={<Icon />}
                  label={label}
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
                Детальные операции
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {financeDetailFields.map(({ key, label, icon: Icon }) => (
                  <PermissionTile
                    key={key}
                    icon={<Icon />}
                    label={label}
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

          <FormField label="Комментарий ограничения">
            <Input
              value={restrictionComment}
              onChange={(event) => setRestrictionComment(event.target.value)}
            />
          </FormField>

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
        "flex min-h-10 w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-semibold leading-tight transition-colors",
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
