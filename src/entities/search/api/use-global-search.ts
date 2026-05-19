import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/shared/api/http";

export type GlobalSearchProduct = {
  id: number;
  name: string;
  imei: string;
  imei2: string | null;
  status: string;
  supplier_name: string | null;
  buy_price: string;
};

export type GlobalSearchTransaction = {
  id: number;
  description: string;
  display_description: string;
  amount: string;
  created_at: string | null;
  product_id: number | null;
  product_name: string | null;
  from_wallet_name: string | null;
  to_wallet_name: string | null;
};

export type GlobalSearchWallet = {
  id: number;
  name: string;
  type: string;
  balance: string;
};

export type GlobalSearchResponse = {
  products: GlobalSearchProduct[];
  transactions: GlobalSearchTransaction[];
  wallets: GlobalSearchWallet[];
};

export function useGlobalSearch(query: string) {
  const normalizedQuery = query.trim();
  const searchParams = new URLSearchParams({ q: normalizedQuery });

  return useQuery({
    queryKey: ["global-search", normalizedQuery],
    queryFn: () =>
      apiRequest<GlobalSearchResponse>(`/api/search?${searchParams.toString()}`),
    enabled: normalizedQuery.length >= 2,
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}
