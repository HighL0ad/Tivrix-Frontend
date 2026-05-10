import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/shared/api/http";
import type { UserRole } from "@/entities/auth/model/types";

export type UserListItem = {
  id: number;
  username: string;
  is_active: boolean;
  role: UserRole;
  is_admin: boolean;
  can_access_dashboard: boolean;
  can_access_products: boolean;
  can_access_finance: boolean;
  can_access_debts: boolean;
  can_access_catalogs: boolean;
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}

export type UserPayload = {
  username: string;
  password?: string;
  is_active: boolean;
  role: UserRole;
  can_access_dashboard: boolean;
  can_access_products: boolean;
  can_access_finance: boolean;
  can_access_debts: boolean;
  can_access_catalogs: boolean;
  restriction_comment?: string | null;
};

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UserPayload & { password: string }) =>
      apiRequest<UserListItem>("/api/users", {
        method: "POST",
        json: payload,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });
}
