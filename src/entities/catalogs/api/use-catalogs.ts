import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/shared/api/http";
import type { Wallet } from "@/entities/finance/api/use-finance";

export type CatalogsData = {
  wallets: Wallet[];
  wallet_types: Array<{ value: string; label: string }>;
};

export function useCatalogs() {
  return useQuery({
    queryKey: ["catalogs"],
    queryFn: () => apiRequest<CatalogsData>("/api/catalogs"),
  });
}

export function useCreateWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; wallet_type: string }) =>
      apiRequest<Wallet>("/api/catalogs/wallets", {
        method: "POST",
        json: payload,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalogs"] }),
  });
}

export function useDeleteWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (walletId: number) =>
      apiRequest<{ ok: boolean }>(`/api/catalogs/wallets/${walletId}`, {
        method: "DELETE",
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalogs"] }),
  });
}

export function useUpdateWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      walletId,
      payload,
    }: {
      walletId: number;
      payload: { name: string; wallet_type: string };
    }) =>
      apiRequest<Wallet>(`/api/catalogs/wallets/${walletId}`, {
        method: "PUT",
        json: payload,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalogs"] }),
  });
}
