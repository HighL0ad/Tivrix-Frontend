import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/shared/api/http";
import type { Wallet } from "@/entities/finance/api/use-finance";

export type Payable = {
  id: number;
  category: string;
  amount: string;
  status: string;
  product_id: number | null;
  product_name: string | null;
  product_imei: string | null;
  product_imei2: string | null;
  created_at: string;
  due_at: string | null;
};

export type DebtsData = {
  we_owe: Wallet[];
  shops_owe_us: Wallet[];
  clients_owe_us: Wallet[];
  all_partners: Wallet[];
  lend_counterparties: Wallet[];
  unpaid_payables: Payable[];
  my_wallets: Wallet[];
  debt_created_at: Record<string, string>;
};

export function useDebts() {
  return useQuery({
    queryKey: ["debts"],
    queryFn: () => apiRequest<DebtsData>("/api/debts"),
  });
}

export function useCreateDebtWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { name: string; wallet_type: string }) =>
      apiRequest<Wallet>("/api/debts/wallets", {
        method: "POST",
        json: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["catalogs"] });
    },
  });
}

export function useRepayDebt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      target_wallet_id: number;
      source_wallet_id: number;
      amount: string;
      operation_type: "pay_supplier" | "receive_client";
    }) =>
      apiRequest<{ ok: boolean }>("/api/debts/repay", {
        method: "POST",
        json: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useLendMoney() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      shop_wallet_id: number;
      source_wallet_id: number;
      amount: string;
      description?: string;
    }) =>
      apiRequest<{ ok: boolean }>("/api/debts/lend-money", {
        method: "POST",
        json: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useBorrowMoney() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: {
      partner_wallet_id: number;
      target_wallet_id: number;
      amount: string;
      description?: string;
    }) =>
      apiRequest<{ ok: boolean }>("/api/debts/borrow-money", {
        method: "POST",
        json: payload,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function usePayPayable() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      payableId,
      sourceWalletId,
    }: {
      payableId: number;
      sourceWalletId: number;
    }) =>
      apiRequest<Payable>(`/api/debts/payables/${payableId}/pay`, {
        method: "POST",
        json: { source_wallet_id: sourceWalletId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
