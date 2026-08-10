import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/shared/api/http";
import type { ProductDetail } from "@/entities/products/model/types";

export function useUndoProductSale(productId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiRequest<ProductDetail>(`/api/products/${productId}/undo-sale`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["products", productId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
    },
  });
}

export function useDeleteProduct(productId: number) {
  return useMutation({
    mutationFn: () =>
      apiRequest<{ ok: boolean }>(`/api/products/${productId}`, {
        method: "DELETE",
      }),
  });
}

export function useUpdateProductSalePrice(productId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: { total_price: string; cash_price?: string | null }) =>
      apiRequest<ProductDetail>(`/api/products/${productId}/sale-price`, {
        method: "PATCH",
        json: payload,
      }),
    onSuccess: (product) => {
      queryClient.setQueryData(["products", product.id], product);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["finance"] });
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
  });
}
