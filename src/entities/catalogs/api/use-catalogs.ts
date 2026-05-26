import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/shared/api/http";
import type { Wallet, WalletType } from "@/entities/finance/api/use-finance";

export type ClientSource = {
  id: number;
  name: string;
};

export type CatalogsData = {
  wallets: Wallet[];
  wallet_types: Array<{ value: WalletType; label: string }>;
  client_sources: ClientSource[];
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
    mutationFn: (payload: { name: string; wallet_type: WalletType }) =>
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
      payload: { name: string; wallet_type: WalletType };
    }) =>
      apiRequest<Wallet>(`/api/catalogs/wallets/${walletId}`, {
        method: "PUT",
        json: payload,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["catalogs"] }),
  });
}

export function useCreateClientSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string }) =>
      apiRequest<ClientSource>("/api/catalogs/client-sources", {
        method: "POST",
        json: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalogs"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateClientSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      sourceId,
      payload,
    }: {
      sourceId: number;
      payload: { name: string };
    }) =>
      apiRequest<ClientSource>(`/api/catalogs/client-sources/${sourceId}`, {
        method: "PUT",
        json: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalogs"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteClientSource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (sourceId: number) =>
      apiRequest<{ ok: boolean }>(`/api/catalogs/client-sources/${sourceId}`, {
        method: "DELETE",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["catalogs"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
