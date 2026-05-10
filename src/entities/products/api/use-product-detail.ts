import { useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/shared/api/http";
import type { ProductDetail } from "@/entities/products/model/types";

export function useProductDetail(productId: number, enabled = true) {
  return useQuery({
    queryKey: ["products", productId],
    queryFn: () => apiRequest<ProductDetail>(`/api/products/${productId}`),
    enabled: enabled && Number.isFinite(productId),
  });
}
