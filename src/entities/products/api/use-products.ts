import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/shared/api/http";
import type { ProductListResponse, ProductStatus } from "@/entities/products/model/types";

type UseProductsParams = {
  status?: ProductStatus;
  supplierIds?: string[];
  registrationStatuses?: string[];
  q?: string;
  sortBy?: "name" | "supplier" | "buy_price" | "deal_price";
  sortDir?: "asc" | "desc";
  page: number;
  limit?: number;
};

export function useProducts({
  status,
  supplierIds,
  registrationStatuses,
  q,
  sortBy,
  sortDir,
  page,
  limit = 50,
}: UseProductsParams) {
  const searchParams = new URLSearchParams();
  searchParams.set("page", String(page));
  searchParams.set("limit", String(limit));

  if (status) {
    searchParams.set("status", status);
  }

  if (q) {
    searchParams.set("q", q);
  }

  if (supplierIds?.length) {
    searchParams.set("supplier_ids", supplierIds.join(","));
  }

  if (registrationStatuses?.length) {
    searchParams.set("registration_statuses", registrationStatuses.join(","));
  }

  if (sortBy) {
    searchParams.set("sort_by", sortBy);
    searchParams.set("sort_dir", sortDir ?? "asc");
  }

  return useQuery({
    queryKey: [
      "products",
      { status, supplierIds, registrationStatuses, q, sortBy, sortDir, page, limit },
    ],
    queryFn: () =>
      apiRequest<ProductListResponse>(`/api/products?${searchParams.toString()}`),
    placeholderData: keepPreviousData,
  });
}
