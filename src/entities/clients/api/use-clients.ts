import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/shared/api/http";

export type Client = {
  id: number;
  name: string;
  phone: string | null;
  backup_phone: string | null;
  description: string | null;
  created_at: string | null;
  total_debt: string;
  ordinary_debt: string;
  purchases_count: number;
  total_purchases: string;
  last_purchase_at: string | null;
};

export type ClientSale = {
  id: number;
  product_id: number;
  product_name: string;
  product_imei: string;
  total_price: string;
  paid_now_amount: string | null;
  sale_mode: string;
  sold_at: string | null;
};

export type ClientDetail = Client & {
  sales: ClientSale[];
  debt_wallets: Array<{ id: number; name: string; balance: string }>;
  payments: Array<{
    id: number;
    amount: string;
    description: string;
    direction: "payment" | "debt" | "adjustment";
    wallet_name: string;
    counterparty_wallet_name: string | null;
    product_id: number | null;
    product_name: string | null;
    created_at: string | null;
  }>;
  installments: Array<{
    id: number;
    sale_id: number;
    product_id: number | null;
    product_name: string | null;
    due_date: string;
    amount: string;
    paid_amount: string;
    status: "pending" | "paid" | "overdue";
    paid_at: string | null;
  }>;
};

export type ClientsResponse = {
  items: Client[];
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  total_debt: string;
  total_purchases_count: number;
  clients_total: number;
  clients_with_debt: number;
  clients_overdue: number;
};

export function useClients(params?: { q?: string; page?: number; limit?: number; filter?: string }) {
  const searchParams = new URLSearchParams({
    page: String(params?.page ?? 1),
    limit: String(params?.limit ?? 25),
  });
  if (params?.q) searchParams.set("q", params.q);
  if (params?.filter) searchParams.set("filter", params.filter);
  return useQuery({
    queryKey: ["clients", params],
    queryFn: () =>
      apiRequest<ClientsResponse>(`/api/clients?${searchParams.toString()}`),
    placeholderData: keepPreviousData,
  });
}

export function useClient(clientId: number | null) {
  return useQuery({
    queryKey: ["clients", clientId],
    queryFn: () => apiRequest<ClientDetail>(`/api/clients/${clientId}`),
    enabled: Boolean(clientId),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      phone?: string;
      backup_phone?: string;
      description?: string;
    }) =>
      apiRequest<Client>("/api/clients", {
        method: "POST",
        json: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateClient(clientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      name: string;
      phone?: string;
      backup_phone?: string;
      description?: string;
    }) =>
      apiRequest<Client>(`/api/clients/${clientId}`, {
        method: "PUT",
        json: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
    },
  });
}

export function useImportLegacyInstallment(clientId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      product_name: string;
      cash_price: string;
      credit_price: string;
      already_paid: string;
      remaining_months: number;
      next_due_date: string;
    }) =>
      apiRequest<ClientDetail>(`/api/clients/${clientId}/installments/import`, {
        method: "POST",
        json: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["clients", clientId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
    },
  });
}
