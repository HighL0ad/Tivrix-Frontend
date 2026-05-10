import { useMutation, useQuery } from "@tanstack/react-query";

import { apiRequest } from "@/shared/api/http";
import type {
  ProductDetail,
  ProductSellOptions,
  ProductSellPayload,
} from "@/entities/products/model/types";

export function useProductSellOptions(productId: number, enabled: boolean) {
  return useQuery({
    queryKey: ["products", productId, "sell-options"],
    queryFn: () =>
      apiRequest<ProductSellOptions>(`/api/products/${productId}/sell-options`),
    enabled,
  });
}

export function useSellProduct(productId: number) {
  return useMutation({
    mutationFn: (payload: ProductSellPayload | FormData) => {
      if (payload instanceof FormData) {
        return apiRequest<ProductDetail>(`/api/products/${productId}/sell-form`, {
          method: "POST",
          body: payload,
        });
      }

      return apiRequest<ProductDetail>(`/api/products/${productId}/sell`, {
        method: "POST",
        json: payload,
      });
    },
  });
}
