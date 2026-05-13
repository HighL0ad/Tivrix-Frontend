import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/shared/api/http";
import type { Transaction } from "@/entities/dashboard/api/use-dashboard";

export type Wallet = {
  id: number;
  name: string;
  type: string;
  balance: string;
};

export type FinanceData = {
  total_profit: string;
  transactions: Transaction[];
  transactions_page: number;
  transactions_limit: number;
  transactions_total: number;
  transactions_total_pages: number;
  transactions_query: string;
  my_wallets: Wallet[];
  cash_wallets: Wallet[];
  debt_wallets: Wallet[];
  position: {
    cash_total: string;
    receivable_total: string;
    clients_owe_total: string;
    shops_owe_total: string;
    owed_total: string;
    wallet_debt_total: string;
    payable_total: string;
    net_balance: string;
  };
  today: FinancePeriodSummary;
  week: FinancePeriodSummary;
  month: FinancePeriodSummary;
};

export type FinancePeriodSummary = {
  income: string;
  expenses: string;
  profit: string;
  operations_count: number;
};

export type ProfitData = {
  today: ProfitAggregate;
  week: ProfitAggregate;
  month: ProfitAggregate;
  all_time: ProfitAggregate;
  selected_period: ProfitAggregate;
  avg_profit_per_sale: string;
  best_sale: {
    product_name: string;
    profit: string;
    buy_price: string;
    total_price: string;
    client_name: string | null;
    source: string | null;
    sold_at: string | null;
  } | null;
  recent_sales: Array<{
    product_name: string;
    profit: string;
    buy_price: string;
    total_price: string;
    client_name: string | null;
    source: string | null;
    sold_at: string | null;
  }>;
  source_stats: Array<{ source: string | null; label: string; count: number; profit: string }>;
  has_custom_period: boolean;
};

export type ProfitAggregate = {
  profit: string;
  count: number;
  buy_total: string;
  margin_percent: string;
};

export type ExpensesData = {
  items: Array<{
    id: number;
    amount: string;
    description: string;
    wallet_name: string;
    created_by_username: string | null;
    created_at: string | null;
  }>;
  total: string;
};

export function useFinance(params: { q?: string; page: number }) {
  const searchParams = new URLSearchParams({ page: String(params.page) });
  if (params.q) {
    searchParams.set("q", params.q);
  }

  return useQuery({
    queryKey: ["finance", params],
    queryFn: () => apiRequest<FinanceData>(`/api/finance?${searchParams.toString()}`),
    placeholderData: keepPreviousData,
  });
}

export function useProfit(params?: {
  date_from?: string;
  date_to?: string;
  enabled?: boolean;
}) {
  const searchParams = new URLSearchParams();
  if (params?.date_from) searchParams.set("date_from", params.date_from);
  if (params?.date_to) searchParams.set("date_to", params.date_to);
  const queryString = searchParams.toString();
  return useQuery({
    queryKey: ["finance", "profit", params],
    queryFn: () =>
      apiRequest<ProfitData>(`/api/finance/profit${queryString ? `?${queryString}` : ""}`),
    enabled: params?.enabled ?? true,
  });
}

export function useExpenses(params?: {
  date_from?: string;
  date_to?: string;
  enabled?: boolean;
}) {
  const searchParams = new URLSearchParams();
  if (params?.date_from) searchParams.set("date_from", params.date_from);
  if (params?.date_to) searchParams.set("date_to", params.date_to);
  const queryString = searchParams.toString();
  return useQuery({
    queryKey: ["finance", "expenses", params],
    queryFn: () =>
      apiRequest<ExpensesData>(`/api/finance/expenses${queryString ? `?${queryString}` : ""}`),
    enabled: params?.enabled ?? true,
  });
}

export function useUndoTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transactionId: number) =>
      apiRequest<{ ok: boolean }>(`/api/finance/transactions/${transactionId}/undo`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
    },
  });
}

export function useUndoSaleTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transactionId: number) =>
      apiRequest<{ ok: boolean }>(`/api/finance/transactions/${transactionId}/undo-sale`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useAdjustWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      walletId,
      payload,
    }: {
      walletId: number;
      payload: {
        mode: "set_balance" | "delta";
        new_balance?: string;
        delta_amount?: string;
        delta_direction?: "income" | "expense";
        description?: string;
      };
    }) =>
      apiRequest<Wallet>(`/api/finance/wallets/${walletId}/adjust`, {
        method: "POST",
        json: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["catalogs"] });
    },
  });
}

export function useTransferWallets() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      source_wallet_id: number;
      target_wallet_id: number;
      amount: string;
      description?: string;
    }) =>
      apiRequest<{ ok: boolean }>("/api/finance/wallets/transfer", {
        method: "POST",
        json: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["catalogs"] });
    },
  });
}
