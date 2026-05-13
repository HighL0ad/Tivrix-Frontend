import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/shared/api/http";
import type { OperationPermissionKey, UserRole } from "@/entities/auth/model/types";

export type UserListItem = {
  id: number;
  username: string;
  avatar_url: string | null;
  password_setup_url: string | null;
  is_active: boolean;
  role: UserRole;
  is_admin: boolean;
  can_access_dashboard: boolean;
  can_access_products: boolean;
  can_access_finance: boolean;
  can_access_debts: boolean;
  can_access_catalogs: boolean;
  can_view_finance_history: boolean;
  can_view_finance_profit: boolean;
  can_view_finance_expenses: boolean;
  can_transfer_wallets: boolean;
  can_adjust_wallets: boolean;
  can_undo_transactions: boolean;
  restriction_comment: string | null;
};

export type UsersData = {
  items: UserListItem[];
  current_user_id: number;
};

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: () => apiRequest<UsersData>("/api/users"),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) =>
      apiRequest<{ ok: boolean }>(`/api/users/${userId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export type UserPayload = {
  username: string;
  is_active: boolean;
  role: UserRole;
  can_access_dashboard: boolean;
  can_access_products: boolean;
  can_access_finance: boolean;
  can_access_debts: boolean;
  can_access_catalogs: boolean;
  can_view_finance_history: boolean;
  can_view_finance_profit: boolean;
  can_view_finance_expenses: boolean;
  can_transfer_wallets: boolean;
  can_adjust_wallets: boolean;
  can_undo_transactions: boolean;
  restriction_comment?: string | null;
};

export const financeOperationFields: Array<{
  key: OperationPermissionKey;
  label: string;
}> = [
  { key: "can_view_finance_history", label: "История" },
  { key: "can_view_finance_profit", label: "Прибыль" },
  { key: "can_view_finance_expenses", label: "Расходы" },
  { key: "can_transfer_wallets", label: "Переводы" },
  { key: "can_adjust_wallets", label: "Корректировка" },
  { key: "can_undo_transactions", label: "Отмена операций" },
];

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserPayload) =>
      apiRequest<UserListItem>("/api/users", {
        method: "POST",
        json: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}

export function useCreatePasswordSetupLink() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) =>
      apiRequest<{ user: UserListItem; password_setup_url: string }>(
        `/api/users/${userId}/password-setup-link`,
        { method: "POST" },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: UserPayload }) =>
      apiRequest<UserListItem>(`/api/users/${userId}`, {
        method: "PUT",
        json: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    },
  });
}
