import { useState } from "react";
import { Pencil } from "lucide-react";

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
import { Checkbox } from "@/shared/ui/checkbox";
import { FormError, FormField } from "@/shared/ui/form";
import { Input } from "@/shared/ui/input";

export function UserDialog({
  mode,
  user,
}: {
  mode: "create" | "edit";
  user?: UserListItem;
}) {
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
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
  const [restrictionComment, setRestrictionComment] = useState(
    user?.restriction_comment ?? "",
  );
  const pending = createUser.isPending || updateUser.isPending;
  const formId = `user-${mode}-${user?.id ?? "new"}`;

  function buildPayload(): UserPayload {
    return {
      username: username.trim(),
      ...(password ? { password } : {}),
      is_active: isActive,
      role,
      ...permissions,
      restriction_comment: restrictionComment.trim() || null,
    };
  }

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={setOpen}
      title={mode === "create" ? "Новый пользователь" : "Редактировать пользователя"}
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
        <div className="flex w-full justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Отмена
          </Button>
          <Button
            type="submit"
            form={formId}
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
                { onSuccess: () => setOpen(false) },
              );
            } else if (user) {
              updateUser.mutate(
                { userId: user.id, payload: buildPayload() },
                { onSuccess: () => setOpen(false) },
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
                options={[
                  { id: "user", name: "user" },
                  { id: "admin", name: "admin" },
                ]}
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

          <div className="space-y-2">
            <div className="text-sm font-semibold text-muted-foreground">
              Доступные разделы
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              {[
                ["can_access_dashboard", "Главная"],
                ["can_access_products", "Товары"],
                ["can_access_finance", "Касса"],
                ["can_access_debts", "Долги"],
                ["can_access_catalogs", "Справочники"],
              ].map(([key, label]) => (
                <label
                  key={key}
                  className={cn(
                    "flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors",
                    permissions[key as keyof typeof permissions]
                      ? "border-sky-300 bg-sky-50 text-sky-800 shadow-sm"
                      : "border-border bg-muted/20 text-muted-foreground",
                  )}
                >
                  <Checkbox
                    checked={permissions[key as keyof typeof permissions]}
                    onCheckedChange={(value) =>
                      setPermissions((current) => ({
                        ...current,
                        [key]: Boolean(value),
                      }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>

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
