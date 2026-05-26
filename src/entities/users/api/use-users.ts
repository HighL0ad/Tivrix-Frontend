import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/shared/api/http";
import type { OperationPermissionKey, UserRole } from "@/entities/auth/model/types";

export type UserListItem = {
  id: number;
  username: string;
  avatar_url: string | null;
  password_setup_url: string | null;
  is_active: boolean;
  created_at: string | null;
  last_login_at: string | null;
  password_set_at: string | null;
  pending_activation: boolean;
  role: UserRole;
  is_admin: boolean;
  can_access_dashboard: boolean;
  can_access_products: boolean;
  can_access_finance: boolean;
  can_access_debts: boolean;
  can_access_clients: boolean;
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
  can_access_clients: boolean;
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
  labelKey: string;
}> = [
  { key: "can_view_finance_history", labelKey: "permissions.financeHistory" },
  { key: "can_view_finance_profit", labelKey: "permissions.financeProfit" },
  { key: "can_view_finance_expenses", labelKey: "permissions.financeExpenses" },
  { key: "can_transfer_wallets", labelKey: "permissions.transferWallets" },
  { key: "can_adjust_wallets", labelKey: "permissions.adjustWallets" },
  { key: "can_undo_transactions", labelKey: "permissions.undoTransactions" },
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
