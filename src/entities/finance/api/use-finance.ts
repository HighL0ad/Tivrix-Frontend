import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/shared/api/http";
import type { Transaction } from "@/entities/dashboard/api/use-dashboard";

export type Wallet = {
  id: number;
  name: string;
  type: WalletType;
  balance: string;
  due_date?: string | null;
};

export type WalletType =
  | "cash"
  | "card"
  | "bank_account"
  | "credit_cash"
  | "employee"
  | "debt"
  | "client_debt"
  | "internal_credit_debt"
  | "shop";

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
  attention: FinanceAttentionSummary;
};

export type FinancePeriodSummary = {
  income: string;
  expenses: string;
  profit: string;
  operations_count: number;
};

export type FinanceAttentionSummary = {
  installment_due_today_amount: string;
  installment_due_today_count: number;
  installment_overdue_amount: string;
  installment_overdue_count: number;
  installment_next_7d_amount: string;
  installment_next_7d_count: number;
  installment_next_30d_amount: string;
  installment_next_30d_count: number;
  shop_overdue_amount: string;
  shop_overdue_count: number;
  registration_alert_count: number;
  active_installment_clients_count: number;
  upcoming_installments: Array<{
    id: number;
    client_id: number;
    client_name: string;
    product_id: number | null;
    product_name: string | null;
    due_date: string;
    remaining_amount: string;
    days_until_due: number;
  }>;
  monthly_forecast: Array<{
    month: string;
    amount: string;
    count: number;
  }>;
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
  recent_sales_page: number;
  recent_sales_limit: number;
  recent_sales_total: number;
  recent_sales_total_pages: number;
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
  page: number;
  limit: number;
  total_count: number;
  total_pages: number;
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
  page?: number;
  limit?: number;
  enabled?: boolean;
}) {
  const searchParams = new URLSearchParams();
  if (params?.date_from) searchParams.set("date_from", params.date_from);
  if (params?.date_to) searchParams.set("date_to", params.date_to);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  const queryString = searchParams.toString();
  return useQuery({
    queryKey: ["finance", "profit", params],
    queryFn: () =>
      apiRequest<ProfitData>(`/api/finance/profit${queryString ? `?${queryString}` : ""}`),
    enabled: params?.enabled ?? true,
    placeholderData: keepPreviousData,
  });
}

export function useExpenses(params?: {
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
  enabled?: boolean;
}) {
  const searchParams = new URLSearchParams();
  if (params?.date_from) searchParams.set("date_from", params.date_from);
  if (params?.date_to) searchParams.set("date_to", params.date_to);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  const queryString = searchParams.toString();
  return useQuery({
    queryKey: ["finance", "expenses", params],
    queryFn: () =>
      apiRequest<ExpensesData>(`/api/finance/expenses${queryString ? `?${queryString}` : ""}`),
    enabled: params?.enabled ?? true,
    placeholderData: keepPreviousData,
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

export function useUndoPurchaseTransaction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (transactionId: number) =>
      apiRequest<{ ok: boolean }>(`/api/finance/transactions/${transactionId}/undo-purchase`, {
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
